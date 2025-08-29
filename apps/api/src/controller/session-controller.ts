import { getDb } from '@/db';
import { WebSocketManager } from '@/lib/websocket-manager';
import { redisSessionService } from '@/service/redis-session-service';
import { sessionDbService } from '@/service/session-db-service';
import { AuthedReq } from '@/types/server';
import { task, workSession } from '@repo/shared/db/schema';
import {
  createEventBroadcast,
  createSessionCancelAck,
  createSessionCompleteAck,
  createSessionError,
  createSessionInitAck,
  createSessionTaskAssigned,
  createSessionTaskUnassigned,
} from '@repo/shared/lib/session-ws';
import { SessionMessage } from '@repo/shared/types/session';
import { WsMessageType } from '@repo/shared/types/websocket';
import { and, eq } from 'drizzle-orm';
import type WebSocket from 'ws';

// Track sockets by userId. Invariant: a user can have multiple sockets, all tied to the same single session.
const userSockets = new Map<string, Set<WebSocket>>();

// Create WebSocket manager for sessions
export const sessionWebSocketManager = new WebSocketManager<SessionMessage>({
  onConnect: (ws: WebSocket, req: AuthedReq) => {
    const userId = req.authSession.user.id;
    console.log(`Session WebSocket connected for user: ${userId}`);
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(ws);

    sessionWebSocketManager.sendToClient(ws, {
      type: WsMessageType.CONNECTION_READY,
      url: ws.url || 'ws://localhost:3001/api/ws/session',
      timestamp: Date.now(),
    });
  },

  onMessage: async (ws: WebSocket, req: AuthedReq, message: SessionMessage) => {
    const userId = req.authSession.user.id;

    try {
      switch (message.type) {
        case WsMessageType.SESSION_INIT: {
          const session = await redisSessionService.createOrGet(userId);
          sessionWebSocketManager.sendToClient(
            ws,
            createSessionInitAck(session.sessionId)
          );
          console.log(`Session ${session.sessionId} ready for user ${userId}`);
          break;
        }

        case WsMessageType.SESSION_ASSIGN_TASK: {
          const { taskId } = message;

          // Ensure a session exists for the user
          const sessionData = await redisSessionService.get(userId);
          if (!sessionData) {
            sendSessionError(
              ws,
              'No active session for this user',
              undefined,
              'NO_SESSION'
            );
            return;
          }

          const db = getDb();
          const [taskDataResult, existingSession] = await Promise.all([
            // Task itself
            db
              .select({ id: task.id, status: task.status })
              .from(task)
              .where(and(eq(task.id, taskId), eq(task.userId, userId)))
              .limit(1),
            // Any existing session
            db
              .select()
              .from(workSession)
              .where(eq(workSession.taskId, taskId))
              .limit(1),
          ]);

          const taskData = taskDataResult[0];

          if (!taskData) {
            sendSessionError(
              ws,
              'Task not found or unauthorized',
              sessionData.sessionId,
              'TASK_NOT_FOUND'
            );
            return;
          }

          if (taskData.status === 'complete') {
            sendSessionError(
              ws,
              'Cannot assign completed task',
              sessionData.sessionId,
              'TASK_COMPLETE'
            );
            return;
          }

          // If the target task already has a committed session, disallow assignment
          if (existingSession && existingSession[0]) {
            sendSessionError(
              ws,
              'Task already has a committed session',
              sessionData.sessionId,
              'TASK_HAS_SESSION'
            );
            return;
          }

          // Assign task to session; do not force task status here (business rule can be decoupled)
          await redisSessionService.assignTask(userId, taskId);

          // Send confirmation to requester
          sessionWebSocketManager.sendToClient(
            ws,
            createSessionTaskAssigned(sessionData.sessionId, taskId)
          );

          // Broadcast to other clients in the same session
          broadcastToUser(
            userId,
            createSessionTaskAssigned(sessionData.sessionId, taskId),
            ws
          );

          console.log(
            `Task ${taskId} assigned to session ${sessionData.sessionId}`
          );
          break;
        }

        case WsMessageType.SESSION_EVENT: {
          const { event } = message;

          const sessionData = await redisSessionService.get(userId);
          if (!sessionData) {
            sendSessionError(
              ws,
              'Session not found',
              undefined,
              'SESSION_NOT_FOUND'
            );
            return;
          }

          // Allow 'stopwatch:start' ONLY when session has task; otherwise require active
          if (sessionData.status !== 'active') {
            const isStartEvent =
              message.event?.type === 'stopwatch' &&
              message.event?.action === 'start';
            const canStartFromInitialized =
              isStartEvent && sessionData.status === 'initialized_with_task';
            if (!canStartFromInitialized) {
              sendSessionError(
                ws,
                'Session is not active',
                sessionData.sessionId,
                'SESSION_NOT_ACTIVE'
              );
              return;
            }
          }

          // Store event in Redis
          await redisSessionService.addEvent(userId, event);

          // On first 'start' with an assigned task, mark task as in_progress
          if (
            event.type === 'stopwatch' &&
            event.action === 'start' &&
            sessionData.taskId &&
            !sessionData.events.some(
              (e) => e.type === 'stopwatch' && e.action === 'start'
            )
          ) {
            const db = getDb();
            await db
              .update(task)
              .set({ status: 'in_progress', updatedAt: new Date() })
              .where(eq(task.id, sessionData.taskId));
          }

          // Broadcast event to all clients in this session
          broadcastToUser(
            userId,
            createEventBroadcast(sessionData.sessionId, event)
          );
          break;
        }

        case WsMessageType.SESSION_UNASSIGN_TASK: {
          const sessionData = await redisSessionService.get(userId);
          if (!sessionData) {
            sendSessionError(
              ws,
              'No active session for this user',
              undefined,
              'NO_SESSION'
            );
            return;
          }

          if (!sessionData.taskId) {
            sendSessionError(
              ws,
              'No task assigned',
              sessionData.sessionId,
              'NO_TASK'
            );
            return;
          }

          await redisSessionService.unassignTask(userId);

          // Notify and broadcast
          sessionWebSocketManager.sendToClient(
            ws,
            createSessionTaskUnassigned(sessionData.sessionId)
          );
          broadcastToUser(
            userId,
            createSessionTaskUnassigned(sessionData.sessionId),
            ws
          );
          break;
        }

        case WsMessageType.SESSION_COMPLETE: {
          const sessionData = await redisSessionService.get(userId);
          if (!sessionData) {
            sendSessionError(
              ws,
              'Session not found',
              undefined,
              'SESSION_NOT_FOUND'
            );
            return;
          }

          if (sessionData.userId !== userId) {
            sendSessionError(
              ws,
              'Unauthorized',
              sessionData.sessionId,
              'UNAUTHORIZED'
            );
            return;
          }

          if (!sessionData.taskId) {
            sendSessionError(
              ws,
              'Cannot complete session without task',
              sessionData.sessionId,
              'NO_TASK'
            );
            return;
          }

          try {
            // Validate and save to database
            await sessionDbService.persistCompletedSession(sessionData);

            // Notify all clients in this session
            broadcastToUser(
              userId,
              createSessionCompleteAck(sessionData.sessionId)
            );

            console.log(
              `Session ${sessionData.sessionId} completed and saved to DB`
            );

            // Remove completed session from Redis now that it's persisted
            await redisSessionService.delete(userId);
          } catch (error) {
            console.error('Failed to save session to database:', error);
            sendSessionError(
              ws,
              'Failed to save session',
              sessionData.sessionId,
              'SAVE_FAILED'
            );
          }
          break;
        }

        case WsMessageType.SESSION_CANCEL: {
          const sessionData = await redisSessionService.get(userId);
          if (sessionData) {
            if (sessionData.userId !== userId) {
              sendSessionError(
                ws,
                'Unauthorized',
                sessionData.sessionId,
                'UNAUTHORIZED'
              );
              return;
            }

            const db = getDb();
            const updates: Promise<unknown>[] = [
              redisSessionService.delete(userId),
              // Potential to add DB update to label taskId as "not_started"
            ];

            if (sessionData.taskId) {
              updates.push(
                db
                  .update(task)
                  .set({ status: 'not_started', updatedAt: new Date() })
                  .where(eq(task.id, sessionData.taskId))
              );
            }

            await Promise.all(updates);
          }

          // Notify all clients in this session
          broadcastToUser(
            userId,
            createSessionCancelAck(sessionData?.sessionId ?? '')
          );

          // Clear user's active session mapping if it still points to this session
          console.log(`Session ${sessionData?.sessionId ?? ''} cancelled`);
          break;
        }

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling session message:', error);
      const current = await redisSessionService.get(userId);
      sendSessionError(
        ws,
        error instanceof Error ? error.message : 'Unknown error',
        current?.sessionId,
        'INTERNAL_ERROR'
      );
    }
  },

  onClose: (ws: WebSocket, req: AuthedReq) => {
    const userId = req.authSession.user.id;
    console.log(`WebSocket closed for user: ${userId}`);

    sessionWebSocketManager.sendToClient(ws, {
      type: WsMessageType.CONNECTION_CLOSED,
      url: ws.url || 'ws://localhost:3001/api/ws/session',
      timestamp: Date.now(),
    });

    const set = userSockets.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) userSockets.delete(userId);
  },

  onError: (ws: WebSocket, req: AuthedReq, error) => {
    const userId = req.authSession.user.id;
    console.error(`Session WebSocket error for user ${userId}:`, error);

    const set = userSockets.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) userSockets.delete(userId);
  },

  enableLogging: true,
});

// **********
// UTILITIES
// **********

// Broadcast to all sockets for a user, optionally excluding a sender
function broadcastToUser(
  userId: string,
  message: SessionMessage,
  excludeWs?: WebSocket
): void {
  let count = 0;
  const set = userSockets.get(userId);
  if (set) {
    set.forEach((sock) => {
      if (sock !== excludeWs && sock.readyState === sock.OPEN) {
        sessionWebSocketManager.sendToClient(sock, message);
        count++;
      }
    });
  }
  console.log(`Broadcasted to ${count} sockets for user ${userId}`);
}

// Send a typed session error to a specific client
function sendSessionError(
  ws: WebSocket,
  error: string,
  sessionId?: string,
  code?: string
): void {
  sessionWebSocketManager.sendToClient(
    ws,
    createSessionError(error, sessionId, code)
  );
}

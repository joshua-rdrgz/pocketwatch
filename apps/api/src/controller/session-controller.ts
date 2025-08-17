import { redisSessionService } from '@/service/redis-session-service';
import {
  authenticateWebSocket,
  type AuthenticatedWebSocket,
} from '@/middleware/ws-auth';
import { WebSocketManager } from '@repo/shared/lib/websocket-manager';
import {
  SessionMessage,
  Event,
  type SessionData,
} from '@repo/shared/types/session';
import { WsMessageType } from '@repo/shared/types/websocket';
import {
  createSessionInitAck,
  createSessionTaskAssigned,
  createSessionError,
  createEventBroadcast,
  createSessionCompleteAck,
  createSessionCancelAck,
} from '@repo/shared/lib/session-ws';
import type { NextFunction, Request } from 'express';
import { getDb } from '@/db';
import { task, workSession, workSessionEvent } from '@repo/shared/db/schema';
import { and, eq } from 'drizzle-orm';

// Track sockets by userId. Invariant: a user can have multiple sockets, all tied to the same single session.
const userSockets = new Map<string, Set<AuthenticatedWebSocket>>();

// Send a typed session error to a specific client
function sendSessionError(
  ws: AuthenticatedWebSocket,
  error: string,
  sessionId?: string,
  code?: string
): void {
  sessionWebSocketManager.sendToClient(
    ws,
    createSessionError(error, sessionId, code)
  );
}

// Save session to database
async function saveSessionToDatabase(sessionData: SessionData): Promise<void> {
  const db = getDb();

  if (!sessionData.taskId) {
    throw new Error('Cannot save session without assigned task');
  }

  try {
    // Narrow optional properties to satisfy Drizzle's non-nullable schema
    const assuredTaskId = sessionData.taskId as string;
    const assuredUserId = sessionData.userId;
    const assuredStartTime = new Date(sessionData.startTime);
    const assuredStatus: 'active' | 'completed' | 'cancelled' =
      sessionData.status === 'idle' ? 'cancelled' : sessionData.status;

    await db.transaction(async (tx) => {
      const endTime = assuredStatus === 'completed' ? new Date() : null;

      // DB creates its own ID, Redis sessionId is not used
      const [newSession] = await tx
        .insert(workSession)
        .values({
          userId: assuredUserId,
          taskId: assuredTaskId,
          startTime: assuredStartTime,
          endTime,
          status: assuredStatus,
        })
        .returning();

      if (!newSession) {
        throw new Error('Failed to create session record');
      }

      if (sessionData.events && sessionData.events.length > 0) {
        await tx.insert(workSessionEvent).values(
          sessionData.events.map((event: Event) => ({
            sessionId: newSession.id, // Use DB-generated session ID
            type: event.type,
            action: event.action,
            timestamp: new Date(event.timestamp),
            payload: 'payload' in event ? event.payload : null,
          }))
        );
      }

      if (assuredStatus === 'completed') {
        await tx
          .update(task)
          .set({
            status: 'complete',
            updatedAt: new Date(),
          })
          .where(eq(task.id, assuredTaskId));
      }
    });

    console.log(
      `Session ${sessionData.sessionId} saved to DB with ${sessionData.events?.length || 0} events`
    );
  } catch (error) {
    console.error('Failed to save session to database:', error);
    throw error;
  }
}

// Create WebSocket manager for sessions
const sessionWebSocketManager = new WebSocketManager<SessionMessage>({
  onConnect: (ws: AuthenticatedWebSocket) => {
    console.log(`Session WebSocket connected for user: ${ws.userId}`);

    const userId = ws.userId!;
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(ws);

    sessionWebSocketManager.sendToClient(ws, {
      type: WsMessageType.CONNECTION_READY,
      url: ws.url || 'ws://localhost:3001/api/ws/session',
      timestamp: Date.now(),
    });
  },

  onMessage: async (ws: AuthenticatedWebSocket, message) => {
    const userId = ws.userId!;

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

          if (sessionData.taskId) {
            sendSessionError(
              ws,
              'Session already has a task assigned',
              sessionData.sessionId,
              'TASK_ALREADY_ASSIGNED'
            );
            return;
          }

          // Verify task exists and belongs to user
          const db = getDb();
          const [taskData] = await db
            .select({
              id: task.id,
              status: task.status,
            })
            .from(task)
            .where(and(eq(task.id, taskId), eq(task.userId, userId)))
            .limit(1);

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

          // Check if task already has a session
          const [existingSession] = await db
            .select()
            .from(workSession)
            .where(eq(workSession.taskId, taskId))
            .limit(1);

          if (existingSession) {
            sendSessionError(
              ws,
              'Task already has a session',
              sessionData.sessionId,
              'TASK_HAS_SESSION'
            );
            return;
          }

          // Assign task to session
          await redisSessionService.assignTask(userId, taskId);

          // Update task status
          await db
            .update(task)
            .set({
              status: 'in_progress',
              updatedAt: new Date(),
            })
            .where(eq(task.id, taskId));

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

          if (sessionData.userId !== userId) {
            sendSessionError(
              ws,
              'Unauthorized',
              sessionData.sessionId,
              'UNAUTHORIZED'
            );
            return;
          }

          if (sessionData.status !== 'active') {
            sendSessionError(
              ws,
              'Session is not active',
              sessionData.sessionId,
              'SESSION_NOT_ACTIVE'
            );
            return;
          }

          // Store event in Redis
          await redisSessionService.addEvent(userId, event);

          // Broadcast event to all clients in this session
          broadcastToUser(
            userId,
            createEventBroadcast(sessionData.sessionId, event)
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

          // Complete the session in Redis
          const completeData = await redisSessionService.complete(userId);

          try {
            // Save to database
            await saveSessionToDatabase({
              ...completeData,
              events: completeData.events,
            });

            // Notify all clients in this session
            broadcastToUser(
              userId,
              createSessionCompleteAck(completeData.sessionId)
            );

            // Clean up tracking
            cleanupUser(userId);

            console.log(
              `Session ${completeData.sessionId} completed and saved to DB`
            );
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
          if (sessionData && sessionData.userId !== userId) {
            sendSessionError(
              ws,
              'Unauthorized',
              sessionData.sessionId,
              'UNAUTHORIZED'
            );
            return;
          }

          if (sessionData) {
            // Update status in Redis
            await redisSessionService.cancel(userId);

            // If task was assigned, reset its status
            if (sessionData.taskId) {
              const db = getDb();
              await db
                .update(task)
                .set({
                  status: 'not_started',
                  updatedAt: new Date(),
                })
                .where(eq(task.id, sessionData.taskId));

              // Save cancelled session for audit
              const cancelledData = await redisSessionService.get(userId);
              if (cancelledData) {
                await saveSessionToDatabase(cancelledData);
              }
            }
          }

          // Notify all clients in this session
          broadcastToUser(
            userId,
            createSessionCancelAck(sessionData?.sessionId ?? '')
          );

          // Clean up tracking
          cleanupUser(userId);

          // Clear user's active session mapping if it still points to this session
          console.log(`Session ${sessionData?.sessionId ?? ''} cancelled`);
          break;
        }

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling session message:', error);
      const current = await redisSessionService.get(ws.userId!);
      sendSessionError(
        ws,
        error instanceof Error ? error.message : 'Unknown error',
        current?.sessionId,
        'INTERNAL_ERROR'
      );
    }
  },

  onClose: (ws: AuthenticatedWebSocket) => {
    console.log(`WebSocket closed for user: ${ws.userId}`);

    const userId = ws.userId!;
    const set = userSockets.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) userSockets.delete(userId);
  },

  onError: (ws: AuthenticatedWebSocket, error) => {
    console.error(`Session WebSocket error for user ${ws.userId}:`, error);

    const userId = ws.userId!;
    const set = userSockets.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) userSockets.delete(userId);
  },

  enableLogging: true,
});

// Broadcast to all sockets for a user, optionally excluding a sender
function broadcastToUser(
  userId: string,
  message: SessionMessage,
  excludeWs?: AuthenticatedWebSocket
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

// Cleanup sockets map for a user
function cleanupUser(userId: string): void {
  userSockets.delete(userId);
}

// Export the authenticated handler
export const handleSessionWebSocket = async (
  ws: AuthenticatedWebSocket,
  req: Request,
  next: NextFunction
) => {
  const authData = await authenticateWebSocket(req);

  if (!authData) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  ws.userId = authData.userId;
  ws.sessionId = authData.sessionId;

  const handler = sessionWebSocketManager.createHandler();
  handler(ws, req, next);
};

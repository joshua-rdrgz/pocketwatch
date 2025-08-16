import { redisService } from '@/lib/redis';
import {
  authenticateWebSocket,
  type AuthenticatedWebSocket,
} from '@/middleware/ws-auth';
import { WebSocketManager } from '@repo/shared/lib/websocket-manager';
import { SessionMessage, Event } from '@repo/shared/types/session';
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
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/db';
import { task, workSession, workSessionEvent } from '@repo/shared/db/schema';
import { and, eq } from 'drizzle-orm';

interface SessionDataWithEvents {
  sessionId: string;
  userId: string;
  taskId?: string;
  startTime: number;
  status: 'idle' | 'active' | 'completed' | 'cancelled';
  events: Event[];
}

// Map to track which session each WebSocket is associated with (1:1)
const wsSessionMap = new Map<AuthenticatedWebSocket, string>();
// Map to track all WebSockets subscribed to each session
const sessionWsMap = new Map<string, Set<AuthenticatedWebSocket>>();

// Save session to database
async function saveSessionToDatabase(
  sessionData: SessionDataWithEvents
): Promise<void> {
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

    // Send connection ready message
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
          // Check if this WebSocket already has a session
          if (wsSessionMap.has(ws)) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'WebSocket already has an active session',
                undefined,
                'ALREADY_HAS_SESSION'
              )
            );
            return;
          }

          // Generate new session ID
          const sessionId = uuidv4();

          // Initialize session in Redis
          await redisService.initSession(sessionId, userId);

          // Track session for this WebSocket
          wsSessionMap.set(ws, sessionId);

          // Track WebSocket for this session
          if (!sessionWsMap.has(sessionId)) {
            sessionWsMap.set(sessionId, new Set());
          }
          sessionWsMap.get(sessionId)!.add(ws);

          // Send acknowledgment
          sessionWebSocketManager.sendToClient(
            ws,
            createSessionInitAck(sessionId)
          );

          console.log(`Session ${sessionId} initialized for user ${userId}`);
          break;
        }

        case WsMessageType.SESSION_ASSIGN_TASK: {
          const { taskId } = message;

          // Get session ID for this WebSocket
          const sessionId = wsSessionMap.get(ws);
          if (!sessionId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'No active session for this connection',
                undefined,
                'NO_SESSION'
              )
            );
            return;
          }

          // Verify session exists and belongs to user
          const sessionData = await redisService.getSession(sessionId);
          if (!sessionData) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Session not found',
                sessionId,
                'SESSION_NOT_FOUND'
              )
            );
            return;
          }

          if (sessionData.userId !== userId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError('Unauthorized', sessionId, 'UNAUTHORIZED')
            );
            return;
          }

          if (sessionData.taskId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Session already has a task assigned',
                sessionId,
                'TASK_ALREADY_ASSIGNED'
              )
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
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Task not found or unauthorized',
                sessionId,
                'TASK_NOT_FOUND'
              )
            );
            return;
          }

          if (taskData.status === 'complete') {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Cannot assign completed task',
                sessionId,
                'TASK_COMPLETE'
              )
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
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Task already has a session',
                sessionId,
                'TASK_HAS_SESSION'
              )
            );
            return;
          }

          // Assign task to session
          await redisService.assignTaskToSession(sessionId, taskId);

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
            createSessionTaskAssigned(sessionId, taskId)
          );

          // Broadcast to other clients in the same session
          broadcastToSession(
            sessionId,
            createSessionTaskAssigned(sessionId, taskId),
            ws
          );

          console.log(`Task ${taskId} assigned to session ${sessionId}`);
          break;
        }

        case WsMessageType.SESSION_EVENT: {
          const { event } = message;

          // Get session ID for this WebSocket
          const sessionId = wsSessionMap.get(ws);
          if (!sessionId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'No active session for this connection',
                undefined,
                'NO_SESSION'
              )
            );
            return;
          }

          const sessionData = await redisService.getSession(sessionId);
          if (!sessionData) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Session not found',
                sessionId,
                'SESSION_NOT_FOUND'
              )
            );
            return;
          }

          if (sessionData.userId !== userId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError('Unauthorized', sessionId, 'UNAUTHORIZED')
            );
            return;
          }

          if (sessionData.status !== 'active') {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Session is not active',
                sessionId,
                'SESSION_NOT_ACTIVE'
              )
            );
            return;
          }

          // Store event in Redis
          await redisService.addEvent(sessionId, event);

          // Broadcast event to all clients in this session
          broadcastToSession(sessionId, createEventBroadcast(sessionId, event));
          break;
        }

        case WsMessageType.SESSION_COMPLETE: {
          // Get session ID for this WebSocket
          const sessionId = wsSessionMap.get(ws);
          if (!sessionId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'No active session for this connection',
                undefined,
                'NO_SESSION'
              )
            );
            return;
          }

          const sessionData = await redisService.getSession(sessionId);
          if (!sessionData) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Session not found',
                sessionId,
                'SESSION_NOT_FOUND'
              )
            );
            return;
          }

          if (sessionData.userId !== userId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError('Unauthorized', sessionId, 'UNAUTHORIZED')
            );
            return;
          }

          if (!sessionData.taskId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Cannot complete session without task',
                sessionId,
                'NO_TASK'
              )
            );
            return;
          }

          // Complete the session in Redis
          const completeData = await redisService.completeSession(sessionId);
          if (!completeData) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Failed to complete session',
                sessionId,
                'COMPLETE_FAILED'
              )
            );
            return;
          }

          try {
            // Save to database
            const fullSessionData: SessionDataWithEvents = {
              ...completeData.metadata,
              events: completeData.events,
            };
            await saveSessionToDatabase(fullSessionData);

            // Notify all clients in this session
            broadcastToSession(sessionId, createSessionCompleteAck(sessionId));

            // Clean up tracking
            cleanupSession(sessionId);

            console.log(`Session ${sessionId} completed and saved to DB`);
          } catch (error) {
            console.error('Failed to save session to database:', error);
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'Failed to save session',
                sessionId,
                'SAVE_FAILED'
              )
            );
          }
          break;
        }

        case WsMessageType.SESSION_CANCEL: {
          // Get session ID for this WebSocket
          const sessionId = wsSessionMap.get(ws);
          if (!sessionId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                'No active session for this connection',
                undefined,
                'NO_SESSION'
              )
            );
            return;
          }

          const sessionData = await redisService.getSession(sessionId);
          if (sessionData && sessionData.userId !== userId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError('Unauthorized', sessionId, 'UNAUTHORIZED')
            );
            return;
          }

          if (sessionData) {
            // Update status in Redis
            await redisService.updateSessionStatus(sessionId, 'cancelled');

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
              const cancelledData = await redisService.getSession(sessionId);
              if (cancelledData) {
                await saveSessionToDatabase(cancelledData);
              }
            }
          }

          // Notify all clients in this session
          broadcastToSession(sessionId, createSessionCancelAck(sessionId));

          // Clean up tracking
          cleanupSession(sessionId);

          console.log(`Session ${sessionId} cancelled`);
          break;
        }

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling session message:', error);
      const sessionId = wsSessionMap.get(ws);
      sessionWebSocketManager.sendToClient(
        ws,
        createSessionError(
          error instanceof Error ? error.message : 'Unknown error',
          sessionId,
          'INTERNAL_ERROR'
        )
      );
    }
  },

  onClose: (ws: AuthenticatedWebSocket) => {
    console.log(`WebSocket closed for user: ${ws.userId}`);

    // Clean up session tracking for this WebSocket
    const sessionId = wsSessionMap.get(ws);
    if (sessionId) {
      wsSessionMap.delete(ws);
      sessionWsMap.get(sessionId)?.delete(ws);

      // If no more WebSockets for this session, clean up the session map entry
      if (sessionWsMap.get(sessionId)?.size === 0) {
        sessionWsMap.delete(sessionId);
      }
    }
  },

  onError: (ws: AuthenticatedWebSocket, error) => {
    console.error(`Session WebSocket error for user ${ws.userId}:`, error);

    // Clean up on error
    const sessionId = wsSessionMap.get(ws);
    if (sessionId) {
      wsSessionMap.delete(ws);
      sessionWsMap.get(sessionId)?.delete(ws);

      if (sessionWsMap.get(sessionId)?.size === 0) {
        sessionWsMap.delete(sessionId);
      }
    }
  },

  enableLogging: true,
});

// Helper to broadcast to all clients in a session except sender
function broadcastToSession(
  sessionId: string,
  message: SessionMessage,
  excludeWs?: AuthenticatedWebSocket
): void {
  let count = 0;
  const wsSet = sessionWsMap.get(sessionId);
  if (wsSet) {
    wsSet.forEach((ws) => {
      if (ws !== excludeWs && ws.readyState === ws.OPEN) {
        sessionWebSocketManager.sendToClient(ws, message);
        count++;
      }
    });
  }
  console.log(`Broadcasted to ${count} clients for session ${sessionId}`);
}

// Helper to clean up session tracking
function cleanupSession(sessionId: string): void {
  // Remove all WebSocket mappings for this session
  const wsSet = sessionWsMap.get(sessionId);
  if (wsSet) {
    wsSet.forEach((ws) => {
      wsSessionMap.delete(ws);
    });
    sessionWsMap.delete(sessionId);
  }

  // Clean up Redis data
  redisService.deleteSession(sessionId);
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

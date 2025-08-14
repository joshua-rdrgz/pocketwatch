import { redisService } from '@/lib/redis';
import {
  authenticateWebSocket,
  type AuthenticatedWebSocket,
} from '@/middleware/ws-auth';
import { WebSocketManager } from '@repo/shared/lib/websocket-manager';
import { SessionMessage, Event } from '@repo/shared/types/session';
import { WsMessageType } from '@repo/shared/types/websocket';
import {
  createSessionStart,
  createSessionError,
  createEventBroadcast,
  createSessionComplete,
  createSessionCancel,
} from '@repo/shared/lib/session-ws';
import type { NextFunction, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/db';
import { task, workSession, workSessionEvent } from '@repo/shared/db/schema';
import { and, eq } from 'drizzle-orm';

type SessionId = string;

interface SessionDataWithEvents {
  sessionId: string;
  userId: string;
  taskId: string;
  startTime: number;
  status: 'active' | 'completed' | 'cancelled';
  events: Event[];
}

// Map to track which sessions each WebSocket is subscribed to
const wsSessionMap = new Map<AuthenticatedWebSocket, Set<SessionId>>();

// Save session to database
async function saveSessionToDatabase(
  sessionId: string,
  sessionData: SessionDataWithEvents
): Promise<void> {
  const db = getDb();

  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Determine end time and status
      const endTime = sessionData.status === 'completed' ? new Date() : null;

      // Create the work session record
      const [newSession] = await tx
        .insert(workSession)
        .values({
          id: sessionId,
          userId: sessionData.userId,
          taskId: sessionData.taskId,
          startTime: new Date(sessionData.startTime),
          endTime: endTime,
          status: sessionData.status,
        })
        .returning();

      if (!newSession) {
        throw new Error('Failed to create session record');
      }

      // Insert all events
      if (sessionData.events && sessionData.events.length > 0) {
        await tx.insert(workSessionEvent).values(
          sessionData.events.map((event: Event) => ({
            sessionId: newSession?.id,
            type: event.type,
            action: event.action,
            timestamp: new Date(event.timestamp),
            payload: 'payload' in event ? event.payload : null,
          }))
        );
      }

      // Update task status based on session status
      if (sessionData.status === 'completed') {
        // When session completes, task is complete
        await tx
          .update(task)
          .set({
            status: 'complete',
            updatedAt: new Date(),
          })
          .where(eq(task.id, sessionData.taskId));
      }
    });

    console.log(
      `Session ${sessionId} saved to database with ${sessionData.events?.length || 0} events`
    );
  } catch (error) {
    console.error('Failed to save session to database:', error);
    throw error;
  }
}

// Create WebSocket manager for sessions
const sessionWebSocketManager = new WebSocketManager<SessionMessage>({
  onConnect: (ws: AuthenticatedWebSocket) => {
    // Initialize the session set for this connection
    wsSessionMap.set(ws, new Set());
    console.log(`Session WebSocket connected for user: ${ws.userId}`);
  },

  onMessage: async (ws: AuthenticatedWebSocket, message) => {
    const userId = ws.userId!; // We know this exists because of auth check

    try {
      switch (message.type) {
        case WsMessageType.SESSION_START: {
          const { taskId } = message;

          // Validate taskId is provided
          if (!taskId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError('', 'Task ID is required to start a session')
            );
            return;
          }

          // Generate new session ID or use provided one
          const sessionId = message.sessionId || uuidv4();

          const db = getDb();

          // Verify task exists and belongs to user
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
              createSessionError(sessionId, 'Task not found or unauthorized')
            );
            return;
          }

          // Check if task is already complete
          if (taskData.status === 'complete') {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                sessionId,
                'Cannot start session for completed task'
              )
            );
            return;
          }

          // Check if a session already exists for this task (1-1 relationship)
          const [existingSession] = await db
            .select()
            .from(workSession)
            .where(eq(workSession.taskId, taskId))
            .limit(1);

          if (existingSession) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                sessionId,
                'A session already exists for this task'
              )
            );
            return;
          }

          // Start session in Redis with task association
          await redisService.startSession(sessionId, userId, taskId);

          // Update task status to in_progress
          await db
            .update(task)
            .set({
              status: 'in_progress',
              updatedAt: new Date(),
            })
            .where(eq(task.id, taskId));

          // Track this WebSocket's interest in this session
          wsSessionMap.get(ws)?.add(sessionId);

          // Send confirmation with both sessionId and taskId
          sessionWebSocketManager.sendToClient(
            ws,
            createSessionStart(sessionId, taskId)
          );

          console.log(
            `Session ${sessionId} started for task ${taskId} by user ${userId}`
          );
          break;
        }

        case WsMessageType.SESSION_EVENT: {
          const { sessionId, event } = message;

          // Verify session exists and belongs to this user
          const sessionData = await redisService.getSession(sessionId);
          if (!sessionData) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(sessionId, 'Session not found')
            );
            return;
          }

          // Verify the session belongs to this user
          if (sessionData.userId !== userId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                sessionId,
                'Unauthorized: Session does not belong to you'
              )
            );
            return;
          }

          // Store event in Redis
          await redisService.addEvent(sessionId, event);

          // Broadcast event to all clients watching this session
          broadcastToSession(sessionId, createEventBroadcast(sessionId, event));
          break;
        }

        case WsMessageType.SESSION_COMPLETE: {
          const { sessionId } = message;

          // Verify ownership before completing
          const sessionData = await redisService.getSession(sessionId);
          if (!sessionData) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(sessionId, 'Session not found')
            );
            return;
          }

          if (sessionData.userId !== userId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                sessionId,
                'Unauthorized: Session does not belong to you'
              )
            );
            return;
          }

          // Complete the session in Redis
          const completeData = await redisService.completeSession(sessionId);
          if (!completeData) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(sessionId, 'Failed to complete session')
            );
            return;
          }

          try {
            // Save to database (combining metadata and events)
            const fullSessionData: SessionDataWithEvents = {
              ...completeData.metadata,
              events: completeData.events,
            };
            await saveSessionToDatabase(sessionId, fullSessionData);

            // Notify all subscribed clients that the session is complete
            broadcastToSession(sessionId, createSessionComplete(sessionId));

            // Clean up Redis data after successful save
            await redisService.deleteSession(sessionId);

            // Remove session from all tracking
            wsSessionMap.forEach((sessions) => sessions.delete(sessionId));

            console.log(
              `Session ${sessionId} completed for task ${completeData.metadata.taskId} with ${completeData.events.length} events`
            );
          } catch (error) {
            console.error('Failed to save session to database:', error);
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                sessionId,
                'Failed to save session to database'
              )
            );
            // Don't delete from Redis if database save failed
            return;
          }
          break;
        }

        case WsMessageType.SESSION_CANCEL: {
          const { sessionId } = message;

          // Verify ownership before cancelling
          const sessionData = await redisService.getSession(sessionId);
          if (sessionData && sessionData.userId !== userId) {
            sessionWebSocketManager.sendToClient(
              ws,
              createSessionError(
                sessionId,
                'Unauthorized: Session does not belong to you'
              )
            );
            return;
          }

          if (sessionData) {
            // Update session status to cancelled
            await redisService.updateSessionStatus(sessionId, 'cancelled');

            // Save cancelled session to database for audit trail
            const cancelledData = await redisService.getSession(sessionId);
            if (cancelledData) {
              await saveSessionToDatabase(sessionId, cancelledData);
            }

            // Since task-session is 1-1, reset task status to not_started
            const db = getDb();
            await db
              .update(task)
              .set({
                status: 'not_started',
                updatedAt: new Date(),
              })
              .where(eq(task.id, sessionData.taskId));
          }

          // Notify all subscribed clients that the session was cancelled
          broadcastToSession(sessionId, createSessionCancel(sessionId));

          // Delete session data from Redis
          await redisService.deleteSession(sessionId);

          // Remove session from all tracking
          wsSessionMap.forEach((sessions) => sessions.delete(sessionId));

          console.log(`Session ${sessionId} cancelled by user ${userId}`);
          break;
        }

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling session message:', error);
      const errSessionId =
        'sessionId' in message ? message.sessionId : 'unknown';
      sessionWebSocketManager.sendToClient(
        ws,
        createSessionError(
          errSessionId,
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
    }
  },

  onClose: (ws: AuthenticatedWebSocket) => {
    // Clean up session tracking for this WebSocket
    wsSessionMap.delete(ws);
    console.log(`WebSocket closed for user: ${ws.userId}`);
  },

  onError: (ws: AuthenticatedWebSocket, error) => {
    console.error(`Session WebSocket error for user ${ws.userId}:`, error);
    wsSessionMap.delete(ws);
  },

  enableLogging: true,
});

// Helper function to broadcast to all clients watching a specific session
function broadcastToSession(sessionId: string, message: SessionMessage): void {
  let count = 0;
  wsSessionMap.forEach((sessions, ws) => {
    if (sessions.has(sessionId) && ws.readyState === ws.OPEN) {
      sessionWebSocketManager.sendToClient(ws, message);
      count++;
    }
  });
  console.log(`Broadcasted to ${count} clients for session ${sessionId}`);
}

// Export the authenticated handler
export const handleSessionWebSocket = async (
  ws: AuthenticatedWebSocket,
  req: Request,
  next: NextFunction
) => {
  // Authenticate the WebSocket connection
  const authData = await authenticateWebSocket(req);

  if (!authData) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  // Attach auth data to the WebSocket
  ws.userId = authData.userId;
  ws.sessionId = authData.sessionId;

  // Pass to the WebSocket manager
  const handler = sessionWebSocketManager.createHandler();
  handler(ws, req, next);
};

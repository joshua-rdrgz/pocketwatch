import { redisService } from '@/lib/redis';
import {
  authenticateWebSocket,
  type AuthenticatedWebSocket,
} from '@/middleware/ws-auth';
import { WebSocketManager } from '@repo/shared/lib/websocket-manager';
import { SessionMessage } from '@repo/shared/types/ws';
import { WsMessageType } from '@repo/shared/types/websocket';
import type { NextFunction, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

type SessionId = string;

// Map to track which sessions each WebSocket is subscribed to
const wsSessionMap = new Map<AuthenticatedWebSocket, Set<SessionId>>();

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
          // Generate new session ID or use provided one
          const sessionId = message.sessionId || uuidv4();

          // Start session in Redis with actual user ID
          await redisService.startSession(sessionId, userId);

          // Track this WebSocket's interest in this session
          wsSessionMap.get(ws)?.add(sessionId);

          // Send confirmation
          sessionWebSocketManager.sendToClient(ws, {
            type: WsMessageType.SESSION_START,
            sessionId,
          });

          console.log(`Session ${sessionId} started for user ${userId}`);
          break;
        }

        case WsMessageType.SESSION_EVENT: {
          const { sessionId, event } = message;

          // Verify session exists and belongs to this user
          const sessionData = await redisService.getSession(sessionId);
          if (!sessionData) {
            sessionWebSocketManager.sendToClient(ws, {
              type: WsMessageType.SESSION_ERROR,
              sessionId,
              error: 'Session not found',
            });
            return;
          }

          // Verify the session belongs to this user
          if (sessionData.userId !== userId) {
            sessionWebSocketManager.sendToClient(ws, {
              type: WsMessageType.SESSION_ERROR,
              sessionId,
              error: 'Unauthorized: Session does not belong to you',
            });
            return;
          }

          // Store event in Redis
          await redisService.addEvent(sessionId, event);

          // Broadcast event to all clients watching this session
          broadcastToSession(sessionId, {
            type: WsMessageType.EVENT_BROADCAST,
            sessionId,
            event,
          });
          break;
        }

        case WsMessageType.SESSION_COMPLETE: {
          const { sessionId } = message;

          // Verify ownership before completing
          const sessionData = await redisService.getSession(sessionId);
          if (!sessionData) {
            sessionWebSocketManager.sendToClient(ws, {
              type: WsMessageType.SESSION_ERROR,
              sessionId,
              error: 'Session not found',
            });
            return;
          }

          if (sessionData.userId !== userId) {
            sessionWebSocketManager.sendToClient(ws, {
              type: WsMessageType.SESSION_ERROR,
              sessionId,
              error: 'Unauthorized: Session does not belong to you',
            });
            return;
          }

          // Get all session data
          const completeData = await redisService.completeSession(sessionId);
          if (!completeData) {
            sessionWebSocketManager.sendToClient(ws, {
              type: WsMessageType.SESSION_ERROR,
              sessionId,
              error: 'Failed to complete session',
            });
            return;
          }

          // TODO: Save to your database here
          // await saveSessionToDatabase(completeData);

          // Clean up Redis data
          await redisService.deleteSession(sessionId);

          // Remove session from all tracking
          wsSessionMap.forEach((sessions) => sessions.delete(sessionId));

          console.log(
            `Session ${sessionId} completed for user ${userId} with ${completeData.events.length} events`
          );
          break;
        }

        case WsMessageType.SESSION_CANCEL: {
          const { sessionId } = message;

          // Verify ownership before cancelling
          const sessionData = await redisService.getSession(sessionId);
          if (sessionData && sessionData.userId !== userId) {
            sessionWebSocketManager.sendToClient(ws, {
              type: WsMessageType.SESSION_ERROR,
              sessionId,
              error: 'Unauthorized: Session does not belong to you',
            });
            return;
          }

          // Delete session data
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
      sessionWebSocketManager.sendToClient(ws, {
        type: WsMessageType.SESSION_ERROR,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sessionId: (message as any).sessionId || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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

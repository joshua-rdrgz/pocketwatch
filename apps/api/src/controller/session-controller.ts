import { WebSocketManager } from '@/lib/websocket-manager';
import { redisSessionService } from '@/service/redis-session-service';
import { sessionDbService } from '@/service/session-db-service';
import { AuthedReq } from '@/types/server';
import {
  createEventBroadcast,
  createSessionCancelAck,
  createSessionCompleteAck,
  createSessionError,
  createSessionInitAck,
} from '@repo/shared/lib/session-ws';
import { SessionMessage } from '@repo/shared/types/session';
import { WsMessageType } from '@repo/shared/types/websocket';
import type WebSocket from 'ws';

// Track sockets by userId. Invariant: a user can have multiple sockets, all tied to the same single session.
const userSockets = new Map<string, Set<WebSocket>>();

// Create WebSocket manager for sessions
export const sessionWebSocketManager = new WebSocketManager<SessionMessage>({
  onConnect: async (ws: WebSocket, req: AuthedReq) => {
    const userId = req.authSession.user.id;
    console.log(`Session WebSocket connected for user: ${userId}`);
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(ws);

    const session = await redisSessionService.createOrGet(userId);

    sessionWebSocketManager.sendToClient(ws, {
      type: WsMessageType.CONNECTION_READY,
      url: ws.url || 'ws://localhost:3001/api/ws/session',
      timestamp: Date.now(),
      session,
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

          // Allow 'stopwatch:start' ONLY when session is initialized; otherwise require active
          if (sessionData.status !== 'active') {
            const isStartEvent =
              message.event?.type === 'stopwatch' &&
              message.event?.action === 'start';
            const canStartFromInitialized =
              isStartEvent && sessionData.status === 'initialized';
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

            await redisSessionService.delete(userId);
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

import { WebSocketManager } from '@/lib/websocket-manager';
import { redisDashService } from '@/service/redis-dash-service';
import { dashDbService } from '@/service/dash-db-service';
import { AuthedReq } from '@/types/server';
import {
  createEventBroadcast,
  createDashCancelAck,
  createDashCompleteAck,
  createDashError,
  createDashInitAck,
} from '@repo/shared/lib/dash-ws';
import { DashMessage } from '@repo/shared/types/dash';
import { WsMessageType } from '@repo/shared/types/websocket';
import type WebSocket from 'ws';

// Track sockets by userId. Invariant: a user can have multiple sockets, all tied to the same single dash.
const userSockets = new Map<string, Set<WebSocket>>();

// Create WebSocket manager for dashes
export const dashWebSocketManager = new WebSocketManager<DashMessage>({
  onConnect: async (ws: WebSocket, req: AuthedReq) => {
    const userId = req.authSession.user.id;
    console.log(`Dash WebSocket connected for user: ${userId}`);
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(ws);

    const dash = await redisDashService.createOrGet(userId);

    dashWebSocketManager.sendToClient(ws, {
      type: WsMessageType.CONNECTION_READY,
      url: ws.url || 'ws://localhost:3001/api/ws/dash',
      timestamp: Date.now(),
      dash,
    });
  },

  onMessage: async (ws: WebSocket, req: AuthedReq, message: DashMessage) => {
    const userId = req.authSession.user.id;

    try {
      switch (message.type) {
        case WsMessageType.DASH_INIT: {
          const dash = await redisDashService.createOrGet(userId);
          dashWebSocketManager.sendToClient(ws, createDashInitAck(dash.dashId));
          console.log(`Dash ${dash.dashId} ready for user ${userId}`);
          break;
        }

        case WsMessageType.DASH_EVENT: {
          const { event } = message;

          const dashData = await redisDashService.get(userId);
          if (!dashData) {
            sendDashError(ws, 'Dash not found', undefined, 'DASH_NOT_FOUND');
            return;
          }

          // Allow 'start' ONLY when dash is initialized; otherwise require active
          if (dashData.status !== 'active') {
            const isStartEvent = message.event?.action === 'start';
            const canStartFromInitialized =
              isStartEvent && dashData.status === 'initialized';
            if (!canStartFromInitialized) {
              sendDashError(
                ws,
                'Dash is not active',
                dashData.dashId,
                'DASH_NOT_ACTIVE'
              );
              return;
            }
          }

          // Store event in Redis
          await redisDashService.addEvent(userId, event);

          // Broadcast event to all clients in this dash
          broadcastToUser(userId, createEventBroadcast(dashData.dashId, event));
          break;
        }

        case WsMessageType.DASH_COMPLETE: {
          const dashData = await redisDashService.get(userId);
          if (!dashData) {
            sendDashError(ws, 'Dash not found', undefined, 'DASH_NOT_FOUND');
            return;
          }

          if (dashData.userId !== userId) {
            sendDashError(ws, 'Unauthorized', dashData.dashId, 'UNAUTHORIZED');
            return;
          }

          try {
            // Validate and save to database
            await dashDbService.persistCompletedDash(dashData);

            // Notify all clients in this dash
            broadcastToUser(userId, createDashCompleteAck(dashData.dashId));

            console.log(`Dash ${dashData.dashId} completed and saved to DB`);

            // Remove completed dash from Redis now that it's persisted
            await redisDashService.delete(userId);
          } catch (error) {
            console.error('Failed to save dash to database:', error);
            sendDashError(
              ws,
              'Failed to save dash',
              dashData.dashId,
              'SAVE_FAILED'
            );
          }
          break;
        }

        case WsMessageType.DASH_CANCEL: {
          const dashData = await redisDashService.get(userId);
          if (dashData) {
            if (dashData.userId !== userId) {
              sendDashError(
                ws,
                'Unauthorized',
                dashData.dashId,
                'UNAUTHORIZED'
              );
              return;
            }

            await redisDashService.delete(userId);
          }

          // Notify all clients in this dash
          broadcastToUser(userId, createDashCancelAck(dashData?.dashId ?? ''));

          // Clear user's active dash mapping if it still points to this dash
          console.log(`Dash ${dashData?.dashId ?? ''} cancelled`);
          break;
        }

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling dash message:', error);
      const current = await redisDashService.get(userId);
      sendDashError(
        ws,
        error instanceof Error ? error.message : 'Unknown error',
        current?.dashId,
        'INTERNAL_ERROR'
      );
    }
  },

  onClose: (ws: WebSocket, req: AuthedReq) => {
    const userId = req.authSession.user.id;
    console.log(`WebSocket closed for user: ${userId}`);

    dashWebSocketManager.sendToClient(ws, {
      type: WsMessageType.CONNECTION_CLOSED,
      url: ws.url || 'ws://localhost:3001/api/ws/dash',
      timestamp: Date.now(),
    });

    const set = userSockets.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) userSockets.delete(userId);
  },

  onError: (ws: WebSocket, req: AuthedReq, error) => {
    const userId = req.authSession.user.id;
    console.error(`Dash WebSocket error for user ${userId}:`, error);

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
  message: DashMessage,
  excludeWs?: WebSocket
): void {
  let count = 0;
  const set = userSockets.get(userId);
  if (set) {
    set.forEach((sock) => {
      if (sock !== excludeWs && sock.readyState === sock.OPEN) {
        dashWebSocketManager.sendToClient(sock, message);
        count++;
      }
    });
  }
  console.log(`Broadcasted to ${count} sockets for user ${userId}`);
}

// Send a typed dash error to a specific client
function sendDashError(
  ws: WebSocket,
  error: string,
  dashId?: string,
  code?: string
): void {
  dashWebSocketManager.sendToClient(ws, createDashError(error, dashId, code));
}

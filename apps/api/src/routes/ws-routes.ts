import { sessionWebSocketManager } from '@/controller/session-controller';
import { type Application } from 'express-ws';

export function addWsRoutes(app: Application) {
  // WebSocket routes
  app.ws('/api/ws/session', sessionWebSocketManager.createHandler());
}

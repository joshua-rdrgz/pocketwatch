import { dashWebSocketManager } from '@/controller/dash-controller';
import { type Application } from 'express-ws';

export function addWsRoutes(app: Application) {
  // WebSocket routes
  app.ws('/api/ws/dash', dashWebSocketManager.createHandler());
}

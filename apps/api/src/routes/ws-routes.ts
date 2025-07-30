import { handleCounterWebSocket } from '@/controller/counter-controller';
import { type Application } from 'express-ws';

export function addWsRoutes(app: Application) {
  // WebSocket routes - authentication is handled within each handler
  app.ws('/api/ws/counter', handleCounterWebSocket);
}

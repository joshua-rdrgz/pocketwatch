import { WebSocketManager } from '@repo/shared/lib/websocket-manager';
import { CounterMessage } from '@repo/shared/types/ws';

// Counter state (in production, this would be stored in a database or Redis)
let currentCount = 0;

// Create WebSocket manager instance
const counterWebSocketManager = new WebSocketManager<CounterMessage>({
  onConnect: (ws) => {
    // Send current count to the newly connected client
    const welcomeMessage: CounterMessage = {
      type: 'COUNT_UPDATE',
      count: currentCount,
    };
    counterWebSocketManager.sendToClient(ws, welcomeMessage);
  },
  onMessage: (_ws, message) => {
    switch (message.type) {
      case 'INCREMENT': {
        currentCount++;
        console.log(`Counter incremented to: ${currentCount}`);

        // Broadcast updated count to all clients
        const updateMessage: CounterMessage = {
          type: 'COUNT_UPDATE',
          count: currentCount,
        };
        counterWebSocketManager.broadcast(updateMessage);
        break;
      }

      case 'GET_COUNT': {
        const countResponse: CounterMessage = {
          type: 'COUNT_UPDATE',
          count: currentCount,
        };
        counterWebSocketManager.sendToClient(_ws, countResponse);
        break;
      }

      default:
        console.log('Unknown message type:', message.type);
    }
  },
  enableLogging: true,
});

// WebSocket connection handler
export const handleCounterWebSocket = counterWebSocketManager.createHandler();

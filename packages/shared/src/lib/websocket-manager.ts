import type { WebsocketRequestHandler } from 'express-ws';
import type WebSocket from 'ws';
import type { WebSocketMessage } from '../types/websocket';

export interface WebSocketManagerConfig<T extends WebSocketMessage> {
  onConnect?: (ws: WebSocket) => void;
  onMessage?: (ws: WebSocket, message: T) => void;
  onClose?: (ws: WebSocket) => void;
  onError?: (ws: WebSocket, error: Error) => void;
  enableLogging?: boolean;
}

export class WebSocketManager<T extends WebSocketMessage = WebSocketMessage> {
  private connectedClients = new Set<WebSocket>();
  private config: WebSocketManagerConfig<T>;

  constructor(config: WebSocketManagerConfig<T> = {}) {
    this.config = {
      enableLogging: true,
      ...config,
    };
  }

  /**
   * Add a client to the connected clients set
   */
  private addClient(ws: WebSocket): void {
    this.connectedClients.add(ws);

    if (this.config.enableLogging) {
      console.log(
        `WebSocket client connected (total: ${this.connectedClients.size})`
      );
    }
  }

  /**
   * Remove a client from the connected clients set
   */
  private removeClient(ws: WebSocket): void {
    if (this.connectedClients.delete(ws)) {
      if (this.config.enableLogging) {
        console.log(
          `WebSocket client disconnected (total: ${this.connectedClients.size})`
        );
      }
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message: T): void {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    const clientsToRemove: WebSocket[] = [];

    this.connectedClients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        try {
          client.send(messageStr);
          sentCount++;
        } catch (error) {
          if (this.config.enableLogging) {
            console.error('Failed to send message to client:', error);
          }
          clientsToRemove.push(client);
        }
      } else {
        // Mark closed connections for removal
        clientsToRemove.push(client);
      }
    });

    // Clean up closed connections
    clientsToRemove.forEach((client) => this.removeClient(client));

    if (this.config.enableLogging) {
      console.log(`Broadcasted message to ${sentCount} clients`);
    }
  }

  /**
   * Send a message to a specific client
   */
  sendToClient(ws: WebSocket, message: T): boolean {
    if (!this.connectedClients.has(ws)) {
      if (this.config.enableLogging) {
        console.warn('Client not found in connected clients');
      }
      return false;
    }

    if (ws.readyState !== ws.OPEN) {
      this.removeClient(ws);
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('Failed to send message to client:', error);
      }
      this.removeClient(ws);
      return false;
    }
  }

  /**
   * Get the number of connected clients
   */
  getClientCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Close all connections and clean up
   */
  closeAll(): void {
    this.connectedClients.forEach((client) => {
      try {
        client.close();
      } catch (error) {
        if (this.config.enableLogging) {
          console.error('Error closing client:', error);
        }
      }
    });
    this.connectedClients.clear();
  }

  /**
   * Create the WebSocket request handler
   */
  createHandler(): WebsocketRequestHandler {
    return (ws, _req) => {
      this.addClient(ws);

      // Call onConnect callback
      if (this.config.onConnect) {
        this.config.onConnect(ws);
      }

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as T;

          if (this.config.onMessage) {
            this.config.onMessage(ws, message);
          }
        } catch (error) {
          if (this.config.enableLogging) {
            console.error('Error parsing message from client:', error);
          }
        }
      });

      // Handle connection close
      ws.on('close', () => {
        this.removeClient(ws);

        if (this.config.onClose) {
          this.config.onClose(ws);
        }
      });

      // Handle connection errors
      ws.on('error', (error) => {
        if (this.config.enableLogging) {
          console.error('WebSocket error:', error);
        }

        this.removeClient(ws);

        if (this.config.onError) {
          this.config.onError(ws, error);
        }
      });
    };
  }
}

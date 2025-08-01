import {
  WebSocketTransport,
  WebSocketTransportOptions,
} from '../../types/websocket-transport';

/**
 * Direct WebSocket transport for web applications.
 * Mirrors the connection infrastructure from WebSocketWorker.
 */
export class DirectWebSocketTransport implements WebSocketTransport {
  private websocket: WebSocket | null = null;
  private messageCallback?: (message: unknown) => void;
  private openCallback?: () => void;
  private closeCallback?: () => void;
  private errorCallback?: (error: unknown) => void;

  // Reconnection / Self-Healing Variables
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private readonly reconnectInterval: number;

  constructor(private options: WebSocketTransportOptions) {
    this.reconnectInterval = options.reconnectInterval ?? 3000;
  }

  connect(): void {
    this.initWebSocket();
  }

  private initWebSocket() {
    try {
      // Close any existing connection
      if (this.websocket) {
        this.websocket.close();
      }

      this.websocket = new WebSocket(this.options.url);

      // Opening Connection
      this.websocket.onopen = () => {
        console.log('[DirectWebSocketTransport] Connected to server');

        // Clear any reconnect timeout
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }

        this.openCallback?.();
      };

      // Receiving Messages
      this.websocket.onmessage = (e) => {
        try {
          const message = JSON.parse(e.data);
          this.messageCallback?.(message);
        } catch (err) {
          console.error(
            '[DirectWebSocketTransport] 🔥 Error parsing server message: ',
            err
          );
        }
      };

      // Closing Connection
      this.websocket.onclose = () => {
        console.log('[DirectWebSocketTransport] Disconnected from server');
        this.closeCallback?.();

        // Auto-reconnect if enabled
        if (this.options.autoReconnect && this.shouldReconnect) {
          this.reconnectTimeout = setTimeout(() => {
            this.initWebSocket();
          }, this.reconnectInterval);
        }
      };

      // Error Handling
      this.websocket.onerror = (err) => {
        console.error('[DirectWebSocketTransport] 🔥 Websocket error: ', err);
        this.errorCallback?.(err);
      };
    } catch (err) {
      console.error(
        '[DirectWebSocketTransport] 🔥 Failed to initialize WebSocket: ',
        err
      );
      this.errorCallback?.(err);
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;

    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Close WebSocket connection
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  send(message: unknown): void {
    // Forward To Server
    if (this.websocket?.readyState === WebSocket.OPEN) {
      try {
        this.websocket.send(JSON.stringify(message));
      } catch (err) {
        console.error(
          '[DirectWebSocketTransport] Error sending to server: ',
          err
        );
      }
    } else {
      console.warn(
        '[DirectWebSocketTransport] Cannot send - WebSocket not connected'
      );
    }
  }

  onMessage(callback: (message: unknown) => void): void {
    this.messageCallback = callback;
  }

  onOpen(callback: () => void): void {
    this.openCallback = callback;
  }

  onClose(callback: () => void): void {
    this.closeCallback = callback;
  }

  onError(callback: (error: unknown) => void): void {
    this.errorCallback = callback;
  }

  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  reconnect(): void {
    // Manual reconnect request
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.initWebSocket();
  }
}

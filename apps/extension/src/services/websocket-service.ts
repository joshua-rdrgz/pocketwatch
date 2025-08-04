import { createMessage } from '@repo/shared/lib/connection';
import {
  Message,
  MessageType,
  TypedMessage,
} from '@repo/shared/types/connection';

type WebSocketMessage =
  | TypedMessage<MessageType.WS_SEND, unknown>
  | TypedMessage<MessageType.WS_RECONNECT, undefined>;

interface ServiceOptions {
  onUpdate: (message: Message) => void;
}

export class WebSocketService {
  private websocket: WebSocket | null = null;
  private readonly websocketUrl = 'ws://localhost:3001/api/ws/counter';
  private onUpdate: (message: Message) => void;

  // Reconnection / Self-Healing Variables
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private readonly reconnectInterval = 3000; // 3 seconds

  // Cache layer (for new extension instances initialized after websocket creation)
  private cache: Map<string, unknown> = new Map();

  constructor(options: ServiceOptions) {
    this.onUpdate = options.onUpdate;
    this.initWebSocket();
    this.setupCleanupListeners();
  }

  registerPort(port: chrome.runtime.Port) {
    // Send current connection status immediately
    port.postMessage(
      createMessage(MessageType.WS_CONNECTED, {
        connected: this.websocket?.readyState === WebSocket.OPEN,
        url: this.websocketUrl,
      })
    );

    // Send cached data to new port connections
    this.sendCachedData(port);

    // Set up message handler
    port.onMessage.addListener((msg) => this.handleMessage(port, msg));
  }

  private initWebSocket() {
    try {
      // Close any existing connection
      if (this.websocket) {
        this.websocket.close();
      }

      this.websocket = new WebSocket(this.websocketUrl);

      this.websocket.onopen = () => {
        this.clearReconnectTimeout();
        this.broadcastMessage(MessageType.WS_CONNECTED, {
          connected: true,
          url: this.websocketUrl,
        });
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Cache the data
          if (data.type) {
            this.cache.set(data.type, data);
          }

          this.broadcastMessage(MessageType.WS_MESSAGE, data);
        } catch (error) {
          console.error(
            '[WebSocketService] 🔥 Error parsing WebSocket message:',
            error
          );
          this.broadcastMessage(MessageType.WS_ERROR, {
            error: 'Failed to parse WebSocket message',
            originalData: event.data,
          });
        }
      };

      this.websocket.onclose = (event) => {
        this.broadcastMessage(MessageType.WS_CONNECTED, {
          connected: false,
          reason: 'Connection closed',
          code: event.code,
        });

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.websocket.onerror = (error) => {
        console.error('[WebSocketService] 🔥 WebSocket error:', error);
        this.broadcastMessage(MessageType.WS_ERROR, {
          error: 'WebSocket connection error',
          details: error,
        });
      };
    } catch (error) {
      console.error(
        '[WebSocketService] 🔥 Failed to initialize WebSocket:',
        error
      );
      this.broadcastMessage(MessageType.WS_ERROR, {
        error: 'Failed to initialize WebSocket',
        details: error,
      });

      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  private handleMessage(_port: chrome.runtime.Port, msg: WebSocketMessage) {
    switch (msg.type) {
      case MessageType.WS_SEND:
        this.sendWebSocketMessage(msg.payload);
        break;
      case MessageType.WS_RECONNECT:
        this.reconnect();
        break;
    }
  }

  private sendWebSocketMessage(data: unknown) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      try {
        this.websocket.send(JSON.stringify(data));
      } catch (error) {
        console.error('[WebSocketService] 🔥 Error sending message:', error);
        this.broadcastMessage(MessageType.WS_ERROR, {
          error: 'Failed to send WebSocket message',
          details: error,
        });
      }
    } else {
      console.warn(
        '[WebSocketService] ⚠️ WebSocket not connected, cannot send message'
      );
      this.broadcastMessage(MessageType.WS_ERROR, {
        error: 'WebSocket not connected',
        attempted_message: data,
      });
    }
  }

  private reconnect() {
    this.clearReconnectTimeout();
    this.initWebSocket();
  }

  private scheduleReconnect() {
    this.clearReconnectTimeout();

    this.reconnectTimeout = setTimeout(() => {
      this.initWebSocket();
    }, this.reconnectInterval);
  }

  private clearReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private sendCachedData(port: chrome.runtime.Port) {
    // Send all cached data to the newly connected port
    this.cache.forEach((data) => {
      port.postMessage(createMessage(MessageType.WS_MESSAGE, data));
    });
  }

  private broadcastMessage(type: MessageType, payload: unknown) {
    const message = createMessage(type, payload);
    this.onUpdate(message);
  }

  private setupCleanupListeners() {
    // Handle extension shutdown
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const handleShutdown = () => {
        this.shouldReconnect = false;
        this.clearReconnectTimeout();
        if (this.websocket) {
          this.websocket.close();
        }
      };

      // Listen for extension suspend/shutdown events
      chrome.runtime.onSuspend?.addListener(handleShutdown);
      chrome.runtime.onSuspendCanceled?.addListener(() => {
        this.shouldReconnect = true;
      });
    }
  }

  // Public method to gracefully shutdown the service
  public shutdown() {
    this.shouldReconnect = false;
    this.clearReconnectTimeout();
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

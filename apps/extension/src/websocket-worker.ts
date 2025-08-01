export class WebSocketWorker {
  private ports: Set<chrome.runtime.Port> = new Set();

  private websocket: WebSocket | null = null;
  private readonly websocketUrl = 'ws://localhost:3001/api/ws/counter';

  // Reconnection / Self-Healing Variables
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private readonly reconnectInterval = 3000; // 3 seconds

  // Cache layer (for new extension instances initialized after websocket creation)
  private cache: Map<string, unknown> = new Map();

  constructor() {
    this.initWebSocket();
    this.setupPortListeners();
    this.setupCleanupListeners();
  }

  private initWebSocket() {
    try {
      // Close any existing connection
      if (this.websocket) {
        this.websocket.close();
      }

      this.websocket = new WebSocket(this.websocketUrl);

      // Opening Connection
      this.websocket.onopen = () => {
        console.log('[WebSocketWorker] Connected to server');
        this.broadcastToAllPorts({
          type: 'WEBSOCKET_CONNECTED',
          isConnected: true,
        });

        // Clear any reconnect timeout
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      // Receiving Messages
      this.websocket.onmessage = (e) => {
        try {
          const message = JSON.parse(e.data);
          this.cacheMessage(message);
          this.broadcastToAllPorts({
            type: 'WEBSOCKET_MESSAGE',
            data: message,
          });
        } catch (err) {
          console.error(
            '[WebSocketWorker] 🔥 Error parsing server message: ',
            err
          );
        }
      };

      // Closing Connection
      this.websocket.onclose = () => {
        console.log('[WebSocketWorker] Disconnected from server');
        this.broadcastToAllPorts({
          type: 'WEBSOCKET_CONNECTED',
          isConnected: false,
        });

        // Auto-reconnect if enabled
        if (this.shouldReconnect) {
          this.reconnectTimeout = setTimeout(() => {
            this.initWebSocket();
          }, this.reconnectInterval);
        }
      };

      // Error Handling
      this.websocket.onerror = (err) => {
        console.error('[WebSocketWorker] 🔥 Websocket error: ', err);
        this.broadcastToAllPorts({
          type: 'WEBSOCKET_ERROR',
          error: 'Connection error',
        });
      };
    } catch (err) {
      console.error(
        '[WebSocketWorker] 🔥 Failed to initialize WebSocket: ',
        err
      );
    }
  }

  private setupPortListeners() {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'websocket') {
        // Add port to collection (Set filters duplicates)
        this.ports.add(port);

        // Send current connection status
        port.postMessage({
          type: 'WEBSOCKET_CONNECTED',
          isConnected: this.websocket?.readyState === WebSocket.OPEN,
        });

        // Send up-to-date info to port via cache
        this.sendCache(port);

        // Handle Incoming Port Messages
        port.onMessage.addListener((message) => {
          this.handlePortMessage(message);
        });

        // Port Disconnection Cleanup
        port.onDisconnect.addListener(() => {
          this.ports.delete(port);
        });
      }
    });
  }

  private handlePortMessage(message: { type: string; data: unknown }) {
    switch (message.type) {
      case 'WEBSOCKET_SEND': {
        // Forward To Server
        if (this.websocket?.readyState === WebSocket.OPEN) {
          try {
            this.websocket.send(JSON.stringify(message.data));
          } catch (err) {
            console.error('[WebSocketWorker] Error sending to server: ', err);
          }
        } else {
          console.warn(
            '[WebSocketWorker] Cannot send - WebSocket not connected'
          );
        }

        break;
      }
      case 'WEBSOCKET_RECONNECT': {
        // Manual reconnect request
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        this.initWebSocket();

        break;
      }
    }
  }

  private broadcastToAllPorts(message: unknown) {
    const deadPorts: chrome.runtime.Port[] = [];

    this.ports.forEach((port) => {
      try {
        port.postMessage(message);
      } catch {
        // Port is disconnected
        console.log('[WebSocketWorker] Removing dead port');
        deadPorts.push(port);
      }
    });

    // Clean up dead ports
    deadPorts.forEach((port) => this.ports.delete(port));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cacheMessage(message: any) {
    switch (message.type) {
      case 'COUNT_UPDATE': {
        this.cache.set('COUNT_UPDATE', message);
        break;
      }
    }
  }

  private sendCache(port: chrome.runtime.Port) {
    this.cache.forEach((item) => {
      try {
        port.postMessage({
          type: 'WEBSOCKET_MESSAGE',
          data: item,
        });
      } catch (err) {
        console.error('[WebSocketWorker] Error sending cached message:', err);
      }
    });
  }

  /**
   * Handles closing connections and clearing ports when service worker shuts down.
   */
  private setupCleanupListeners() {
    // Handle service worker suspension/shutdown
    if (typeof chrome !== 'undefined' && chrome.runtime?.onSuspend) {
      chrome.runtime.onSuspend.addListener(() => {
        console.log(
          '[WebSocketWorker] Service worker suspending, cleaning up...'
        );
        this.performCleanup();
      });
    }

    // Fallback: handle beforeunload event
    self.addEventListener('beforeunload', () => {
      console.log('[WebSocketWorker] Service worker unloading, cleaning up...');
      this.performCleanup();
    });
  }

  private performCleanup() {
    this.shouldReconnect = false;

    // Close WebSocket connection
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    // Clear all ports
    this.ports.clear();
  }
}

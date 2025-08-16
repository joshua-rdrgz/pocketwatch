import {
  WebSocketTransport,
  WebSocketTransportOptions,
} from '../../types/websocket-transport';
import { createExtensionMessage } from '../connection';
import {
  ExtensionMessageType,
  PortName,
} from '../../types/extension-connection';

/**
 * Chrome port transport for browser extensions.
 */
export class ChromePortTransport implements WebSocketTransport {
  private port: chrome.runtime.Port | null = null;
  private messageCallback?: (message: unknown) => void;
  private openCallback?: () => void;
  private closeCallback?: () => void;
  private errorCallback?: (error: unknown) => void;

  // Reconnection / Self-Healing Variables
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private readonly reconnectInterval: number;
  private connected = false;

  constructor(private options: WebSocketTransportOptions) {
    this.reconnectInterval = options.reconnectInterval ?? 3000;
  }

  connect(): void {
    this.initPort();
  }

  private initPort() {
    try {
      // Close existing port if any
      if (this.port) {
        this.port.disconnect();
      }

      // Connect to WebSocket worker
      this.port = chrome.runtime.connect({ name: PortName.POCKETWATCH });

      // Handle Incoming Port Messages
      this.port.onMessage.addListener((message) => {
        this.handlePortMessage(message);
      });

      // Port Disconnection Cleanup
      this.port.onDisconnect.addListener(() => {
        console.log('[ChromePortTransport] Port disconnected');
        this.connected = false;
        this.closeCallback?.();

        // Auto-reconnect if enabled
        if (this.options.autoReconnect && this.shouldReconnect) {
          this.reconnectTimeout = setTimeout(() => {
            this.initPort();
          }, this.reconnectInterval);
        }
      });
    } catch (err) {
      console.error(
        '[ChromePortTransport] 🔥 Failed to initialize Chrome port: ',
        err
      );
      this.errorCallback?.(err);
    }
  }

  private handlePortMessage(message: { type: string; payload?: unknown }) {
    // Handle messages using ExtensionMessageType enum from WebSocketService
    switch (message.type) {
      case ExtensionMessageType.WS_CONNECTED: {
        const payload = message.payload as {
          connected: boolean;
          url?: string;
          reason?: string;
          code?: number;
        };
        const wasConnected = this.connected;
        this.connected = payload.connected;

        if (this.connected && !wasConnected) {
          console.log(
            '[ChromePortTransport] Connected to server via service worker'
          );

          // Clear any reconnect timeout
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }

          this.openCallback?.();
        } else if (!this.connected && wasConnected) {
          console.log(
            '[ChromePortTransport] Disconnected from server via service worker'
          );
          this.closeCallback?.();

          // Auto-reconnect if enabled
          if (this.options.autoReconnect && this.shouldReconnect) {
            this.reconnectTimeout = setTimeout(() => {
              this.initPort();
            }, this.reconnectInterval);
          }
        }
        break;
      }
      case ExtensionMessageType.WS_MESSAGE: {
        this.messageCallback?.(message.payload);
        break;
      }
      case ExtensionMessageType.WS_ERROR: {
        console.error(
          '[ChromePortTransport] 🔥 WebSocket error from service worker:',
          message.payload
        );
        const errorPayload = message.payload as { error: string };
        this.errorCallback?.(new Error(errorPayload.error));
        break;
      }
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;

    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Disconnect port
    if (this.port) {
      this.port.disconnect();
      this.port = null;
    }

    this.connected = false;
  }

  send(message: unknown): void {
    // Forward To Server using MessageType enum
    if (this.port && this.connected) {
      try {
        this.port.postMessage(
          createExtensionMessage(ExtensionMessageType.WS_SEND, message)
        );
      } catch (err) {
        console.error(
          '[ChromePortTransport] Error sending to service worker: ',
          err
        );
      }
    } else {
      console.warn(
        '[ChromePortTransport] Cannot send - Chrome port not connected'
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
    return this.connected;
  }

  reconnect(): void {
    // Manual reconnect request using MessageType enum
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.port) {
      this.port.postMessage(
        createExtensionMessage(ExtensionMessageType.WS_RECONNECT)
      );
    } else {
      this.initPort();
    }
  }
}

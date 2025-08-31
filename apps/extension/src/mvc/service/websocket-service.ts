/* eslint-disable @typescript-eslint/no-explicit-any */
import { DashWsRetryState } from '@repo/shared/types/dash';

interface WebSocketServiceConfig {
  getToken(): Promise<string | null>;
  onConnect(): void;
  onDisconnect(): void;
  onRetryStateChange?(wsRetryState: DashWsRetryState): void;
}

interface WebSocketRetryConfig {
  count: number;
  maxRetries: number;
  delays: number[];
  timeoutId: NodeJS.Timeout | null;
  isIntentionalDisconnect: boolean;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private WS_URL = process.env.PUBLIC_WS_URL;
  private messageHandlers: Map<string, (msg: any) => void> = new Map();
  private retryConfig: WebSocketRetryConfig = {
    count: 0,
    maxRetries: 5,
    delays: [1000, 2000, 4000, 8000, 16000],
    timeoutId: null,
    isIntentionalDisconnect: false,
  };

  constructor(private config: WebSocketServiceConfig) {}

  async connect() {
    this.retryConfig.isIntentionalDisconnect = false;
    this.retryConfig.count = 0;
    this.attemptConnection();
  }

  private async attemptConnection() {
    if (this.retryConfig.isIntentionalDisconnect) return;

    try {
      const token = await this.config.getToken();
      if (!token) throw new Error('No authentication token available');

      this.ws = new WebSocket(`${this.WS_URL}?token=${token}`);

      this.ws.onopen = () => {
        console.log('[WebSocketService] Connected!');
        // Reset retry state on successful connection
        this.retryConfig.count = 0;
        if (this.retryConfig.timeoutId) {
          clearTimeout(this.retryConfig.timeoutId);
          this.retryConfig.timeoutId = null;
        }
        this.config.onConnect();
      };

      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        this.messageHandlers.get(msg.type)?.(msg);
      };

      this.ws.onerror = () => this.scheduleRetry();

      this.ws.onclose = () => {
        console.log('[WebSocketService] Closed!');
        this.config.onDisconnect();
        if (!this.retryConfig.isIntentionalDisconnect) this.scheduleRetry();
      };
    } catch (error) {
      console.error('[WebSocketService] Connection failed:', error);
      this.scheduleRetry();
    }
  }

  private scheduleRetry() {
    if (
      this.retryConfig.count >= this.retryConfig.maxRetries ||
      this.retryConfig.isIntentionalDisconnect
    ) {
      return;
    }

    const delay = this.retryConfig.delays[this.retryConfig.count++] || 16000;
    console.log(
      `[WebSocketService] Retrying in ${delay}ms (${this.retryConfig.count}/${this.retryConfig.maxRetries})`
    );

    this.config.onRetryStateChange?.({
      isReconnecting: true,
      currentAttempt: this.retryConfig.count,
    });

    this.retryConfig.timeoutId = setTimeout(
      () => this.attemptConnection(),
      delay
    );
  }

  onMessage<T>(type: string, handler: (msg: T) => void) {
    this.messageHandlers.set(type, handler);
  }

  send(msg: any): { success: boolean; error?: string } {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return { success: false, error: 'WebSocket not connected' };
    }

    try {
      this.ws.send(JSON.stringify(msg));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  disconnect() {
    this.retryConfig.isIntentionalDisconnect = true;
    if (this.retryConfig.timeoutId) {
      clearTimeout(this.retryConfig.timeoutId);
      this.retryConfig.timeoutId = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

import { type MessageCreator } from '@repo/shared/lib/session-ws';

interface SessionWebSocketServiceConfig {
  getOneTimeToken(): Promise<string | null>;
}

export class SessionWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private getOneTimeToken: () => Promise<string | null>;

  constructor(config: SessionWebSocketServiceConfig) {
    const url = process.env.PUBLIC_WS_URL;
    if (!url) {
      throw new Error("ENV variable for Websocket URL isn't defined!");
    }
    this.url = url;

    this.getOneTimeToken = config.getOneTimeToken;
  }

  async connect() {
    console.log('[session-websocket-service] now connecting!');
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = this.generateConnectionString();
      this.ws = new WebSocket(wsUrl.toString());

      this.ws.onopen = () => {
        console.log('WebSocket connected');
      };

      this.ws.onmessage = (msg) => {
        console.log('WebSocket message received: ', msg);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  disconnect() {
    console.log('[session-websocket-service] now disconnecting!');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage<T extends readonly unknown[]>(
    messageCreator: MessageCreator<T>,
    ...args: T
  ) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = messageCreator(...args);
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }

  private async generateConnectionString() {
    const oneTimeToken = await this.getOneTimeToken();
    if (!oneTimeToken) {
      throw new Error('No session token found');
    }

    const wsUrl = new URL(this.url);
    wsUrl.searchParams.set('token', oneTimeToken);

    console.log('URL OF WEBSOCKET: ', wsUrl.toString());

    return wsUrl;
  }
}

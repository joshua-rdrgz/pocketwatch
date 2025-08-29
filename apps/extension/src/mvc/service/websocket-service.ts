/* eslint-disable @typescript-eslint/no-explicit-any */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private WS_URL = process.env.PUBLIC_WS_URL;
  private messageHandlers: Map<string, (msg: any) => void> = new Map();

  constructor(private config: { getToken: () => Promise<string | null> }) {}

  async connect() {
    const token = await this.config.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    this.ws = new WebSocket(`${this.WS_URL}?token=${token}`);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const handler = this.messageHandlers.get(msg.type);
      handler?.(msg);
    };
  }

  onMessage<T>(type: string, handler: (msg: T) => void) {
    this.messageHandlers.set(type, handler);
  }

  send(msg: any): { success: boolean; error?: string } {
    if (!this.ws) {
      return { success: false, error: 'WebSocket not connected' };
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      return { success: false, error: 'WebSocket connection not ready' };
    }

    try {
      this.ws.send(JSON.stringify(msg));
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown WebSocket error';
      console.error('Failed to send WebSocket message:', error);
      return { success: false, error: errorMessage };
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

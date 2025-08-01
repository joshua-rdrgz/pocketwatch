export interface WebSocketTransport {
  connect(): void;
  disconnect(): void;
  send(message: unknown): void;
  onMessage(callback: (message: unknown) => void): void;
  onOpen(callback: () => void): void;
  onClose(callback: () => void): void;
  onError(callback: (error: unknown) => void): void;
  isConnected(): boolean;
  reconnect(): void;
}

export interface WebSocketTransportOptions {
  url: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

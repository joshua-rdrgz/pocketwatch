export enum WsMessageType {
  SESSION_START = 'SESSION_START',
  SESSION_EVENT = 'SESSION_EVENT',
  SESSION_COMPLETE = 'SESSION_COMPLETE',
  SESSION_CANCEL = 'SESSION_CANCEL',
  EVENT_BROADCAST = 'EVENT_BROADCAST',
  SESSION_ERROR = 'SESSION_ERROR',
}

// Base envelope for WebSocket messages used across server and clients
export interface WebSocketMessage {
  type: WsMessageType | string;
  error?: string;
  requestId?: string;
  timestamp?: number;
  // Additional fields are allowed and constrained by specific unions
  [key: string]: unknown;
}




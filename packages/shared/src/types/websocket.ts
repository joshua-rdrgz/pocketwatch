export enum WsMessageType {
  // Dash lifecycle messages (client -> server)
  DASH_INIT = 'DASH_INIT', // Initialize dash
  DASH_EVENT = 'DASH_EVENT', // Timer events (start/pause/resume/finish)
  DASH_COMPLETE = 'DASH_COMPLETE', // Commit dash to DB
  DASH_CANCEL = 'DASH_CANCEL', // Cancel dash

  // Server responses (server -> client)
  DASH_INIT_ACK = 'DASH_INIT_ACK', // Server acknowledges dash init
  EVENT_BROADCAST = 'EVENT_BROADCAST', // Server broadcasts events to all clients
  DASH_COMPLETE_ACK = 'DASH_COMPLETE_ACK', // Server confirms completion
  DASH_CANCEL_ACK = 'DASH_CANCEL_ACK', // Server confirms cancellation
  DASH_ERROR = 'DASH_ERROR', // Server error response

  // Connection status (for internal use)
  CONNECTION_READY = 'CONNECTION_READY', // WebSocket connected and ready
  CONNECTION_CLOSED = 'CONNECTION_CLOSED', // WebSocket disconnected
}

// Base envelope for WebSocket messages used across server and clients
export interface WebSocketMessage {
  type: WsMessageType | string;
  error?: string;
  // Additional fields are allowed and constrained by specific unions
  [key: string]: unknown;
}

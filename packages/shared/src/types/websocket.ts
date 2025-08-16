export enum WsMessageType {
  // Session lifecycle messages (client -> server)
  SESSION_INIT = 'SESSION_INIT', // Initialize session without task
  SESSION_ASSIGN_TASK = 'SESSION_ASSIGN_TASK', // Link task to current session
  SESSION_EVENT = 'SESSION_EVENT', // Timer events (start/pause/resume/finish)
  SESSION_COMPLETE = 'SESSION_COMPLETE', // Commit session to DB
  SESSION_CANCEL = 'SESSION_CANCEL', // Cancel session

  // Server responses (server -> client)
  SESSION_INIT_ACK = 'SESSION_INIT_ACK', // Server acknowledges session init
  SESSION_TASK_ASSIGNED = 'SESSION_TASK_ASSIGNED', // Server confirms task assignment
  EVENT_BROADCAST = 'EVENT_BROADCAST', // Server broadcasts events to all clients
  SESSION_COMPLETE_ACK = 'SESSION_COMPLETE_ACK', // Server confirms completion
  SESSION_CANCEL_ACK = 'SESSION_CANCEL_ACK', // Server confirms cancellation
  SESSION_ERROR = 'SESSION_ERROR', // Server error response

  // Connection status (for internal use)
  CONNECTION_READY = 'CONNECTION_READY', // WebSocket connected and ready
  CONNECTION_CLOSED = 'CONNECTION_CLOSED', // WebSocket disconnected
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

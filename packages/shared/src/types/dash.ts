import { WebSocketMessage, WsMessageType } from './websocket';

// **************
// DASH EVENT types
// **************

export type DashEventAction = 'start' | 'break' | 'resume' | 'finish';

export type DashEvent = {
  action: DashEventAction;
  timestamp: number;
};

// **************
// STOPWATCH types
// **************

export type StopwatchTimers = {
  total: number;
  work: number;
  break: number;
};

export type StopwatchMode = 'not_started' | 'work' | 'break' | null;

// **************
// WEBSOCKET types
// **************

export interface DashData {
  dashId: string;
  userId: string;
  status: DashLifeCycle;
  events: DashEvent[];
}

export type DashLifeCycle = 'initialized' | 'active' | 'completed' | null;

export type DashWsConnectionStatus =
  | 'connected'
  | 'not_connected'
  | 'reconnecting';

export interface DashWsRetryState {
  isReconnecting: boolean;
  currentAttempt: number;
}

export interface DashUpdatePayload {
  events: DashEvent[];
  timers: StopwatchTimers;
  stopwatchMode: StopwatchMode;
  dashLifeCycle: DashLifeCycle;
  wsConnectionStatus: DashWsConnectionStatus;
  wsRetryState: DashWsRetryState;
}

export type DashMessage = WebSocketMessage &
  // Client -> Server messages (no dashId)
  (| {
        type: WsMessageType.DASH_INIT;
      }
    | {
        type: WsMessageType.DASH_EVENT;
        event: DashEvent;
      }
    | {
        type: WsMessageType.DASH_COMPLETE;
      }
    | {
        type: WsMessageType.DASH_CANCEL;
      }
    // Server -> Client messages (with dashId)
    | {
        type: WsMessageType.DASH_INIT_ACK;
        dashId: string;
        status: 'initialized';
      }
    | {
        type: WsMessageType.EVENT_BROADCAST;
        dashId: string;
        event: DashEvent;
      }
    | {
        type: WsMessageType.DASH_COMPLETE_ACK;
        dashId: string;
      }
    | {
        type: WsMessageType.DASH_CANCEL_ACK;
        dashId: string;
      }
    | {
        type: WsMessageType.DASH_ERROR;
        dashId?: string;
        error: string;
        code?: string;
      }
    | {
        type: WsMessageType.CONNECTION_READY;
        url: string;
        dash: DashData;
      }
    | {
        type: WsMessageType.CONNECTION_CLOSED;
        reason?: string;
        code?: number;
      }
  );

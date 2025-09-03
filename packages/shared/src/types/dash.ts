import { DashInfo } from '../lib/dash';
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
  userId: string;
  status: DashLifeCycle;
  events: DashEvent[];
  metadata?: DashInfo;
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
  dashInfo: DashInfo;
  wsConnectionStatus: DashWsConnectionStatus;
  wsRetryState: DashWsRetryState;
}

export type DashMessage = WebSocketMessage &
  // Client -> Server messages
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
    | {
        type: WsMessageType.DASH_INFO_CHANGE;
        dashInfo: DashInfo;
      }
    // Server -> Client messages
    | {
        type: WsMessageType.DASH_INIT_ACK;
        status: 'initialized';
      }
    | {
        type: WsMessageType.DASH_INFO_CHANGE_BROADCAST;
        dashInfo: DashInfo;
      }
    | {
        type: WsMessageType.EVENT_BROADCAST;
        event: DashEvent;
      }
    | {
        type: WsMessageType.DASH_COMPLETE_ACK;
      }
    | {
        type: WsMessageType.DASH_CANCEL_ACK;
      }
    | {
        type: WsMessageType.DASH_ERROR;
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

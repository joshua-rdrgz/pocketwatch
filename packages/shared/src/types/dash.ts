import { WebSocketMessage, WsMessageType } from './websocket';

// **************
// EVENT types
// **************

type StopwatchEventType = 'start' | 'break' | 'resume' | 'finish';
type BrowserEventType = 'tab_open' | 'tab_close' | 'website_visit';

export type EventType = 'stopwatch' | 'browser';

// Maps each event type to its actions
type EventActionMap = {
  stopwatch: StopwatchEventType;
  browser: BrowserEventType;
};

// Maps each event type and action to its payload type
type EventPayloadMap = {
  stopwatch: {
    start: undefined;
    break: undefined;
    resume: undefined;
    finish: undefined;
  };
  browser: {
    tab_open: undefined;
    tab_close: undefined;
    website_visit: {
      url: string;
      tabId: number;
    };
  };
};

// Gets all actions for a given event type
type ActionsOf<T extends EventType> = EventActionMap[T];

// Gets the payload for a given event type and action
export type PayloadOf<
  T extends EventType,
  A extends string,
> = A extends keyof EventPayloadMap[T] ? EventPayloadMap[T][A] : undefined;

// Generates a discriminated union for a single event type
export type EventVariants<T extends EventType> = {
  [A in ActionsOf<T>]: PayloadOf<T, A> extends undefined
    ? { type: T; action: A; timestamp: number }
    : { type: T; action: A; timestamp: number; payload: PayloadOf<T, A> };
}[ActionsOf<T>];

export type Event<T extends EventType> = EventVariants<T>;

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
  events: Event<'stopwatch' | 'browser'>[];
}

export type DashLifeCycle = 'idle' | 'initialized' | 'active' | 'completed';

export type DashWsConnectionStatus =
  | 'connected'
  | 'not_connected'
  | 'reconnecting';

export interface DashWsRetryState {
  isReconnecting: boolean;
  currentAttempt: number;
}

export interface DashUpdatePayload {
  events: Event<'stopwatch' | 'browser'>[];
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
        event: Event<'stopwatch' | 'browser'>;
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
        status: 'idle';
      }
    | {
        type: WsMessageType.EVENT_BROADCAST;
        dashId: string;
        event: Event<'stopwatch' | 'browser'>;
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

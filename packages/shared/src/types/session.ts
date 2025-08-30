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

export interface SessionData {
  sessionId: string;
  userId: string;
  taskId?: string; // Optional since session can exist without task
  status: SessionLifeCycle;
  events: Event<'stopwatch' | 'browser'>[];
}

export type SessionLifeCycle =
  | 'idle'
  | 'initialized_no_task'
  | 'initialized_with_task'
  | 'active'
  | 'completed';

export type SessionWsConnectionStatus =
  | 'connected'
  | 'not_connected'
  | 'reconnecting';

export interface SessionWsRetryState {
  isReconnecting: boolean;
  currentAttempt: number;
}

export interface SessionUpdatePayload {
  events: Event<'stopwatch' | 'browser'>[];
  timers: StopwatchTimers;
  stopwatchMode: StopwatchMode;
  assignedTaskId: string | null;
  sessionLifeCycle: SessionLifeCycle;
  wsConnectionStatus: SessionWsConnectionStatus;
  wsRetryState: SessionWsRetryState;
}

export type SessionMessage = WebSocketMessage &
  // Client -> Server messages (no sessionId)
  (| {
        type: WsMessageType.SESSION_INIT;
      }
    | {
        type: WsMessageType.SESSION_ASSIGN_TASK;
        taskId: string;
      }
    | {
        type: WsMessageType.SESSION_UNASSIGN_TASK;
      }
    | {
        type: WsMessageType.SESSION_EVENT;
        event: Event<'stopwatch' | 'browser'>;
      }
    | {
        type: WsMessageType.SESSION_COMPLETE;
      }
    | {
        type: WsMessageType.SESSION_CANCEL;
      }
    // Server -> Client messages (with sessionId)
    | {
        type: WsMessageType.SESSION_INIT_ACK;
        sessionId: string;
        status: 'idle';
      }
    | {
        type: WsMessageType.SESSION_TASK_ASSIGNED;
        sessionId: string;
        taskId: string;
      }
    | {
        type: WsMessageType.SESSION_TASK_UNASSIGNED;
        sessionId: string;
      }
    | {
        type: WsMessageType.EVENT_BROADCAST;
        sessionId: string;
        event: Event<'stopwatch' | 'browser'>;
      }
    | {
        type: WsMessageType.SESSION_COMPLETE_ACK;
        sessionId: string;
      }
    | {
        type: WsMessageType.SESSION_CANCEL_ACK;
        sessionId: string;
      }
    | {
        type: WsMessageType.SESSION_ERROR;
        sessionId?: string;
        error: string;
        code?: string;
      }
    | {
        type: WsMessageType.CONNECTION_READY;
        url: string;
        session: SessionData;
      }
    | {
        type: WsMessageType.CONNECTION_CLOSED;
        reason?: string;
        code?: number;
      }
  );

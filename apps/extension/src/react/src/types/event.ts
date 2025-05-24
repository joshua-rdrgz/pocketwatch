type StopwatchEventType = 'start' | 'break' | 'resume' | 'finish';
type TaskEventType = 'task_complete';
type BrowserEventType = 'tab_open' | 'tab_close' | 'website_visit';

export type EventType = 'stopwatch' | 'task' | 'browser';

// Maps each event type to its actions
type EventActionMap = {
  stopwatch: StopwatchEventType;
  task: TaskEventType;
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
  task: {
    task_complete: string;
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

export type Event =
  | EventVariants<'stopwatch'>
  | EventVariants<'task'>
  | EventVariants<'browser'>;

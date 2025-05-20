type StopwatchEventType = 'start' | 'break' | 'resume' | 'finish';
type TaskEventType = 'task_complete';
type BrowserEventType = 'tab_open' | 'tab_close' | 'website_visit';

export type EventType = 'stopwatch' | 'task' | 'browser';

export type EventActionType<T extends EventType = EventType> =
  T extends 'stopwatch'
    ? StopwatchEventType
    : T extends 'task'
      ? TaskEventType
      : T extends 'browser'
        ? BrowserEventType
        : never;

export type EventPayloadType<T extends EventType = EventType> =
  T extends 'stopwatch'
    ? never
    : T extends 'task'
      ? TaskEventType extends 'task_complete'
        ? string
        : never
      : T extends 'browser'
        ? BrowserEventType extends 'website_visit'
          ? string
          : never
        : never;

export interface Event<T extends EventType = EventType> {
  type: T;
  action: EventActionType<T>;
  timestamp: number;
  payload?: EventPayloadType<T> extends never ? undefined : EventPayloadType<T>;
}

export type StopwatchTimers = {
  total: number;
  work: number;
  break: number;
  extBreak: number;
};

export type StopwatchMode = 'work' | 'break' | 'extBreak' | null;

export type EventType =
  | 'start'
  | 'break'
  | 'extended_break'
  | 'resume'
  | 'finish';

export type Event = { type: EventType; timestamp: number };

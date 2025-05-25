export type StopwatchTimers = {
  total: number;
  work: number;
  break: number;
};

export type StopwatchMode = 'not_started' | 'work' | 'break' | null;

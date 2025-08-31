import {
  StopwatchTimers,
  StopwatchMode,
  DashEvent,
} from '@repo/shared/types/dash';

interface StopwatchConstructor {
  onUpdate(): void;
}

export class Stopwatch {
  private timerInterval: NodeJS.Timeout | null = null;
  private timers: StopwatchTimers = {
    total: 0,
    work: 0,
    break: 0,
  };
  private currentMode: StopwatchMode = 'not_started';
  private lastTick: number | null = null;
  private onUpdate: () => void;

  constructor({ onUpdate }: StopwatchConstructor) {
    this.onUpdate = onUpdate;
  }

  getTimers() {
    return this.timers;
  }

  getMode() {
    return this.currentMode;
  }

  startTimer(initialTimes = { total: 0, work: 0, break: 0 }) {
    this.timers = initialTimes;
    this.lastTick = Date.now();

    if (this.currentMode === 'not_started') {
      this.currentMode = 'work';
    }

    if (this.timerInterval === null) {
      this.timerInterval = setInterval(() => {
        const now = Date.now();
        const delta = now - (this.lastTick || now);
        this.lastTick = now;

        this.timers.total += delta;

        if (this.currentMode && this.currentMode !== 'not_started') {
          this.timers[this.currentMode] += delta;
        }

        // Send updates to all connected ports
        this.onUpdate();
      }, 100);
    }
  }

  setTimerMode(mode: StopwatchMode) {
    this.currentMode = mode;
    this.lastTick = Date.now();
    this.onUpdate();
  }

  stopTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.onUpdate();
    }
  }

  resetTimer() {
    this.stopTimer();
    this.lastTick = null;
    this.currentMode = 'not_started';
    this.timers = { total: 0, work: 0, break: 0 };
    this.onUpdate();
  }

  applyEventHistory(events: DashEvent[]) {
    // Reset state
    this.timers = { total: 0, work: 0, break: 0 };
    this.currentMode = 'not_started';

    const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);

    if (sortedEvents.length === 0) return;

    const now = Date.now();
    let sessionStart = 0;
    let lastEventTime = 0;
    let currentMode: StopwatchMode = 'not_started';

    // Process each event and accumulate times
    for (const event of sortedEvents) {
      const prevMode = currentMode;

      // Add time from previous period
      if (prevMode === 'work' || prevMode === 'break') {
        this.timers[prevMode] += event.timestamp - lastEventTime;
      }

      // Update mode and tracking
      switch (event.action) {
        case 'start':
          sessionStart = event.timestamp;
          currentMode = 'work';
          break;
        case 'break':
          currentMode = 'break';
          break;
        case 'resume':
          currentMode = 'work';
          break;
        case 'finish':
          currentMode = null;
          break;
      }

      lastEventTime = event.timestamp;
    }

    // Add time from last event to now if still active
    if (currentMode === 'work' || currentMode === 'break') {
      this.timers[currentMode] += now - lastEventTime;
    }

    // Calculate total time
    this.timers.total = sessionStart
      ? (currentMode ? now : lastEventTime) - sessionStart
      : 0;

    // Update state and start timer if active
    this.currentMode = currentMode;

    if (currentMode === 'work' || currentMode === 'break') {
      this.startTimer(this.timers);
    }

    this.onUpdate();
  }
}

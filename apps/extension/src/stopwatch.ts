type StopwatchTimers = {
  total: number;
  work: number;
  break: number;
};
type StopwatchMode = 'not_started' | 'work' | 'break' | null;

interface StopwatchConstructor {
  onUpdate(): void;
}

export class Stopwatch {
  private startTime: number | null = null;
  private timerInterval: number | null = null;
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
    this.startTime = Date.now();
    this.currentMode = 'work';
    this.lastTick = Date.now();

    if (this.timerInterval === null) {
      this.timerInterval = setInterval(() => {
        const now = Date.now();
        const delta = now - (this.lastTick || now);
        this.lastTick = now;

        if (this.startTime) {
          this.timers.total = now - this.startTime;
        }

        if (this.currentMode && this.currentMode !== 'not_started') {
          this.timers[this.currentMode] += delta;
        }

        // Send updates to all connected ports
        this.onUpdate();
      }, 100) as unknown as number;
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
    this.startTime = null;
    this.lastTick = null;
    this.currentMode = 'not_started';
    this.timers = { total: 0, work: 0, break: 0 };
    this.onUpdate();
  }
}

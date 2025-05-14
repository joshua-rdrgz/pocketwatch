type StopwatchTimers = {
  total: number;
  work: number;
  break: number;
};
type StopwatchMode = 'not_started' | 'work' | 'break' | null;

export class StopwatchWorker {
  private startTime: number | null = null;
  private timerInterval: number | null = null;
  private timers: StopwatchTimers = {
    total: 0,
    work: 0,
    break: 0,
  };
  private currentMode: StopwatchMode = 'not_started';
  private lastTick: number | null = null;
  private ports: chrome.runtime.Port[] = [];

  constructor() {
    // Set up port connection listener
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'stopwatch') {
        this.ports.push(port);

        // Send initial state
        this.sendUpdate(port);

        // Set up message handler
        port.onMessage.addListener((msg) => this.handleMessage(port, msg));

        // Handle disconnection
        port.onDisconnect.addListener(() => {
          this.ports = this.ports.filter((p) => p !== port);
        });
      }
    });
  }

  private sendUpdate(port?: chrome.runtime.Port) {
    const update = {
      type: 'update',
      timers: this.timers,
      mode: this.currentMode,
    };

    if (port) {
      port.postMessage(update);
    } else {
      this.ports.forEach((p) => p.postMessage(update));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessage(_port: chrome.runtime.Port, msg: any) {
    switch (msg.action) {
      case 'start':
        this.start(msg.initialTimes);
        break;
      case 'stop':
        this.stop();
        break;
      case 'reset':
        this.reset();
        break;
      case 'setMode':
        this.setMode(msg.mode);
        break;
    }
  }

  start(initialTimes = { total: 0, work: 0, break: 0 }) {
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
        this.sendUpdate();
      }, 100) as unknown as number;
    }
  }

  setMode(mode: StopwatchMode) {
    this.currentMode = mode;
    this.lastTick = Date.now();
    this.sendUpdate();
  }

  stop() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.sendUpdate();
    }
  }

  reset() {
    this.stop();
    this.startTime = null;
    this.lastTick = null;
    this.currentMode = 'not_started';
    this.timers = { total: 0, work: 0, break: 0 };
    this.sendUpdate();
  }
}

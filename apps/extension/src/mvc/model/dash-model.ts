import { Stopwatch } from '@repo/shared/lib/stopwatch';
import {
  DashEvent,
  DashData,
  DashLifeCycle,
  DashWsConnectionStatus,
  DashWsRetryState,
  StopwatchMode,
  StopwatchTimers,
} from '@repo/shared/types/dash';
import { BaseModel } from './base';
import { DashInfo } from '@repo/shared/lib/dash';

export interface DashState {
  events: DashEvent[];
  timers: StopwatchTimers;
  stopwatchMode: StopwatchMode;
  dashLifeCycle: DashLifeCycle;
  dashInfo: DashInfo;
  wsConnectionStatus: DashWsConnectionStatus;
  wsRetryState: DashWsRetryState;
}

export class DashModel extends BaseModel<DashState> {
  private stopwatch: Stopwatch;

  constructor() {
    super({
      events: [],
      timers: { total: 0, work: 0, break: 0 },
      stopwatchMode: 'not_started',
      dashLifeCycle: null,
      dashInfo: {
        name: '',
        category: '',
        notes: '',
        isMonetized: false,
        hourlyRate: 0,
      },
      wsConnectionStatus: 'not_connected',
      wsRetryState: {
        isReconnecting: false,
        currentAttempt: 0,
      },
    });

    this.stopwatch = new Stopwatch({
      onUpdate: () => this.updateTimersFromStopwatch(),
    });
  }

  _initStateFromServer(dashData: Partial<DashData>) {
    this.stopwatch.applyEventHistory(dashData.events || []);
    this.setState({
      events: dashData.events || [],
      dashLifeCycle: dashData.status || null,
    });
  }

  addEvent(event: DashEvent) {
    const currentEvents = this.getState().events;
    this.setState({ events: [...currentEvents, event] });
  }

  setDashLifeCycle(lifecycle: DashLifeCycle) {
    this.setState({ dashLifeCycle: lifecycle });

    // Update stopwatch mode based on lifecycle
    if (lifecycle === 'active') {
      this.setState({ stopwatchMode: 'work' });
    } else if (lifecycle === 'completed') {
      this.setState({ stopwatchMode: null });
    }
  }

  setDashInfo(newDashInfo: DashInfo) {
    const dashInfo = { ...this.getState().dashInfo, ...newDashInfo };
    this.setState({ dashInfo });
  }

  setWsConnectionStatus(wsConnectionStatus: DashWsConnectionStatus) {
    this.setState({ wsConnectionStatus });
  }

  setWsRetryState(wsRetryState: DashWsRetryState) {
    this.setState({ wsRetryState });
  }

  // Timer Actions
  startTimer() {
    this.stopwatch.startTimer();
  }

  stopTimer() {
    this.stopwatch.stopTimer();
  }

  resetTimer() {
    this.stopwatch.resetTimer();
  }

  setTimerMode(mode: StopwatchMode) {
    this.stopwatch.setTimerMode(mode);
  }

  private updateTimersFromStopwatch() {
    this.setState({
      timers: this.stopwatch.getTimers(),
      stopwatchMode: this.stopwatch.getMode(),
    });
  }
}

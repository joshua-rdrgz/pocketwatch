import { Stopwatch } from '@repo/shared/lib/stopwatch';
import {
  Event,
  PayloadOf,
  SessionData,
  SessionLifeCycle,
  SessionWsConnectionStatus,
  SessionWsRetryState,
  StopwatchMode,
  StopwatchTimers,
} from '@repo/shared/types/session';
import { BaseModel } from './base';

export interface SessionState {
  events: Event<'stopwatch' | 'browser'>[];
  timers: StopwatchTimers;
  stopwatchMode: StopwatchMode;
  assignedTaskId: string | null;
  sessionLifeCycle: SessionLifeCycle;
  wsConnectionStatus: SessionWsConnectionStatus;
  wsRetryState: SessionWsRetryState;
}

export class SessionModel extends BaseModel<SessionState> {
  private stopwatch: Stopwatch;

  constructor() {
    super({
      events: [],
      timers: { total: 0, work: 0, break: 0 },
      stopwatchMode: 'not_started',
      assignedTaskId: null,
      sessionLifeCycle: 'idle',
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

  _initStateFromServer(sessionData: Partial<SessionData>) {
    this.stopwatch.applyEventHistory(sessionData.events || []);
    this.setState({
      events: sessionData.events || [],
      assignedTaskId: sessionData.taskId || null,
      sessionLifeCycle: sessionData.status || 'idle',
    });
  }

  updateEvents(events: Event<'stopwatch' | 'browser'>[]) {
    this.setState({ events });
  }

  addEvent(event: Event<'stopwatch' | 'browser'>) {
    const currentEvents = this.getState().events;
    this.setState({ events: [...currentEvents, event] });
  }

  clearEvents() {
    this.setState({ events: [] });
  }

  setAssignedTaskId(taskId: string | null) {
    this.setState({ assignedTaskId: taskId });
  }

  setSessionLifeCycle(lifecycle: SessionLifeCycle) {
    this.setState({ sessionLifeCycle: lifecycle });

    // Update stopwatch mode based on lifecycle
    if (lifecycle === 'active') {
      this.setState({ stopwatchMode: 'work' });
    } else if (lifecycle === 'completed') {
      this.setState({ stopwatchMode: null });
    }
  }

  setWsConnectionStatus(wsConnectionStatus: SessionWsConnectionStatus) {
    this.setState({ wsConnectionStatus });
  }

  setWsRetryState(wsRetryState: SessionWsRetryState) {
    this.setState({ wsRetryState });
  }

  updateSessionState(payload: {
    events: Event<'stopwatch' | 'browser'>[];
    timers: StopwatchTimers;
    stopwatchMode: StopwatchMode;
    assignedTaskId: string | null;
    sessionLifeCycle: SessionLifeCycle;
  }) {
    this.setState(payload);
  }

  findLastUrlOfTab(tabId: number): string | undefined {
    const events = this.getState().events;
    const lastLogOfTabId = events
      .filter(
        (ev) =>
          ev.type === 'browser' &&
          ev.action === 'website_visit' &&
          'payload' in ev &&
          tabId === (ev.payload as PayloadOf<'browser', 'website_visit'>).tabId
      )
      .at(-1) as Event<'browser'>;
    if (lastLogOfTabId && 'payload' in lastLogOfTabId) {
      return (lastLogOfTabId.payload as PayloadOf<'browser', 'website_visit'>)
        .url;
    }
    return undefined;
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

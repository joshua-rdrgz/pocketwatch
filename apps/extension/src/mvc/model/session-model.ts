import {
  Event,
  SessionLifeCycle,
  StopwatchMode,
  StopwatchTimers,
} from '@repo/shared/types/session';
import { BaseModel } from './base';

export interface SessionState {
  events: Event[];
  timers: StopwatchTimers;
  stopwatchMode: StopwatchMode;
  assignedTaskId: string | null;
  sessionLifeCycle: SessionLifeCycle;
}

export class SessionModel extends BaseModel<SessionState> {
  constructor() {
    super({
      events: [],
      timers: { total: 0, work: 0, break: 0 },
      stopwatchMode: 'not_started',
      assignedTaskId: null,
      sessionLifeCycle: 'idle',
    });
  }

  updateEvents(events: Event[]) {
    this.setState({ events });
  }

  addEvent(event: Event) {
    const currentEvents = this.getState().events;
    this.setState({ events: [...currentEvents, event] });
  }

  clearEvents() {
    this.setState({ events: [] });
  }

  updateTimers(timers: StopwatchTimers) {
    this.setState({ timers });
  }

  setStopwatchMode(mode: StopwatchMode) {
    this.setState({ stopwatchMode: mode });
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

  updateSessionState(payload: {
    events: Event[];
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
          tabId === ev.payload.tabId
      )
      .at(-1);

    if (
      lastLogOfTabId &&
      'payload' in lastLogOfTabId &&
      typeof lastLogOfTabId.payload === 'object'
    ) {
      return lastLogOfTabId.payload.url;
    }
    return undefined;
  }
}

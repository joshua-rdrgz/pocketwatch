import { create } from 'zustand';
import {
  Event,
  EventType,
  EventVariants,
  PayloadOf,
  StopwatchMode,
  StopwatchTimers,
} from '@repo/shared/types/session';
import {
  ExtensionMessage,
  ExtensionMessageType,
} from '@repo/shared/types/extension-connection';
import { createExtensionMessage } from '@repo/shared/lib/connection';

// Initial timers state
const initialTimers: StopwatchTimers = {
  total: 0,
  work: 0,
  break: 0,
};

// Type for SESSION_UPDATE message payload
interface SessionUpdatePayload {
  events: Event[];
  hasSessionStarted: boolean;
  stopwatch: {
    timers: StopwatchTimers;
    mode: StopwatchMode;
  };
}

interface SessionState {
  // ******
  // EVENTS
  // ******
  events: Event[];

  // ******
  // STOPWATCH
  // ******
  timers: StopwatchTimers;
  stopwatchMode: StopwatchMode;

  // ******
  // MISC
  // ******
  isSessionFinished: boolean;

  // Store the sendMessage function
  _sendMessage: ((message: ExtensionMessage) => void) | null;
}

interface SessionActions {
  // Setup
  setSendMessage(sendMessage: (message: ExtensionMessage) => void): void;

  // Event actions
  logEvent<T extends EventType>(
    event: Omit<EventVariants<T>, 'timestamp'>
  ): void;
  clearEvents(): void;

  // Stopwatch actions
  handleStopwatchStart(): void;
  handleStopwatchStop(): void;
  setStopwatchMode(mode: StopwatchMode): void;
  resetStopwatch(): void;

  // URL handling
  handleUrlClick(payload: PayloadOf<'browser', 'website_visit'>): void;

  // Internal state updates
  setEvents(events: Event[]): void;
  setTimers(timers: StopwatchTimers): void;
  setSWMode(mode: StopwatchMode): void;
  updateFromSessionMessage(payload: SessionUpdatePayload): void;
}

type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>((set, get) => ({
  // Initial state
  events: [],
  timers: initialTimers,
  stopwatchMode: null,
  isSessionFinished: false,
  _sendMessage: null,

  // Setup
  setSendMessage: (sendMessage: (message: ExtensionMessage) => void) => {
    set({ _sendMessage: sendMessage });
  },

  // Event actions
  logEvent: <T extends EventType>(
    event: Omit<EventVariants<T>, 'timestamp'>
  ) => {
    const { _sendMessage } = get();
    if (!_sendMessage) {
      console.warn('sendMessage not set in session store');
      return;
    }

    const newEvent: Event = { ...event, timestamp: Date.now() } as Event;
    _sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_ADD_EVENT, newEvent)
    );
  },

  clearEvents: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;

    _sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_CLEAR_EVENTS)
    );
  },

  // Stopwatch actions
  handleStopwatchStart: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;

    _sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_START_TIMER)
    );
  },

  handleStopwatchStop: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;

    _sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_STOP_TIMER)
    );
  },

  setStopwatchMode: (mode: StopwatchMode) => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;

    _sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_SET_TIMER_MODE, mode)
    );
  },

  resetStopwatch: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;

    _sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_RESET_TIMER)
    );
  },

  // URL handling
  handleUrlClick: (payload: PayloadOf<'browser', 'website_visit'>) => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;

    _sendMessage(
      createExtensionMessage(
        ExtensionMessageType.SESSION_WEBSITE_VISIT,
        payload
      )
    );
  },

  // Internal state updates
  setEvents: (events: Event[]) => {
    set({
      events,
      isSessionFinished: events.some(
        (ev) => ev.type === 'stopwatch' && ev.action === 'finish'
      ),
    });
  },

  setTimers: (timers: StopwatchTimers) => {
    set({ timers });
  },

  setSWMode: (stopwatchMode: StopwatchMode) => {
    set({ stopwatchMode });
  },

  updateFromSessionMessage: (payload: SessionUpdatePayload) => {
    set((state) => {
      const newEvents = payload.events || [];
      return {
        events: newEvents,
        isSessionFinished: newEvents.some(
          (ev) => ev.type === 'stopwatch' && ev.action === 'finish'
        ),
        timers: payload.stopwatch?.timers || state.timers,
        stopwatchMode:
          payload.stopwatch?.mode !== undefined
            ? payload.stopwatch.mode
            : state.stopwatchMode,
      };
    });
  },
}));

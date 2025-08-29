import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessage,
  ExtensionMessageType,
} from '@repo/shared/types/extension-connection';
import {
  Event,
  EventType,
  EventVariants,
  PayloadOf,
  SessionLifeCycle,
  SessionUpdatePayload,
  StopwatchMode,
  StopwatchTimers,
} from '@repo/shared/types/session';
import { create } from 'zustand';

// Initial timers state
const initialTimers: StopwatchTimers = {
  total: 0,
  work: 0,
  break: 0,
};

interface SessionState {
  // ******
  // EVENTS
  // ******
  events: Event<'stopwatch' | 'browser'>[];

  // ******
  // STOPWATCH
  // ******
  timers: StopwatchTimers;
  stopwatchMode: StopwatchMode;

  // ******
  // SESSION
  // ******
  assignedTaskId: string | null;
  sessionLifeCycle: SessionLifeCycle;

  // Store the sendMessage function
  _sendMessage: ((message: ExtensionMessage) => void) | null;
}

interface SessionActions {
  // Setup
  setSendMessage(sendMessage: (message: ExtensionMessage) => void): void;

  // Session lifecycle actions
  initSession(): void;
  assignTask(taskId: string): void;
  unassignTask(): void;
  completeSession(): void;
  cancelSession(): void;
  logEvent<T extends EventType>(
    event: Omit<EventVariants<T>, 'timestamp'>
  ): void;

  // Reaction to server payloads
  syncSession(payload: SessionUpdatePayload): void;
  handleUrlClick(payload: PayloadOf<'browser', 'website_visit'>): void;
}

type SessionStore = SessionState & SessionActions;

const initialSessionState: SessionState = {
  events: [],
  timers: initialTimers,
  stopwatchMode: null,
  assignedTaskId: null,
  sessionLifeCycle: 'idle',
  _sendMessage: null,
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  // Initial state
  ...initialSessionState,

  // Setup
  setSendMessage: (sendMessage: (message: ExtensionMessage) => void) => {
    set({ _sendMessage: sendMessage });
  },

  // Session lifecycle actions
  initSession: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;
    _sendMessage(createExtensionMessage(ExtensionMessageType.SESSION_INIT));
  },

  assignTask: (taskId: string) => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;
    _sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_ASSIGN_TASK, taskId)
    );
  },

  unassignTask: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;
    _sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_UNASSIGN_TASK)
    );
  },

  completeSession: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;
    _sendMessage(createExtensionMessage(ExtensionMessageType.SESSION_COMPLETE));
  },

  cancelSession: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;
    _sendMessage(createExtensionMessage(ExtensionMessageType.SESSION_CANCEL));
  },

  logEvent: <T extends EventType>(
    event: Omit<EventVariants<T>, 'timestamp'>
  ) => {
    const { _sendMessage } = get();
    if (!_sendMessage) {
      console.warn('sendMessage not set in session store');
      return;
    }

    const newEvent: Event<T> = { ...event, timestamp: Date.now() } as Event<T>;
    _sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_EVENT, newEvent)
    );
  },

  syncSession: (payload: SessionUpdatePayload) => {
    console.log('[session-store] syncSession to: ', payload);
    set((state) => ({
      ...state,
      events: payload.events,
      timers: payload.timers,
      stopwatchMode: payload.stopwatchMode,
      assignedTaskId: payload.assignedTaskId,
      sessionLifeCycle: payload.sessionLifeCycle,
    }));
  },

  handleUrlClick: (payload: PayloadOf<'browser', 'website_visit'>) => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;

    _sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_URL_CLICK, payload)
    );
  },
}));

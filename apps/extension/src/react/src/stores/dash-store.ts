import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessage,
  ExtensionMessageType,
} from '@repo/shared/types/extension-connection';
import {
  DashEvent,
  DashLifeCycle,
  DashUpdatePayload,
  DashWsConnectionStatus,
  DashWsRetryState,
  StopwatchMode,
  StopwatchTimers,
} from '@repo/shared/types/dash';
import { create } from 'zustand';
import { DashInfo } from '@repo/shared/lib/dash';

// Initial timers state
const initialTimers: StopwatchTimers = {
  total: 0,
  work: 0,
  break: 0,
};

interface DashState {
  // ******
  // EVENTS
  // ******
  events: DashEvent[];

  // ******
  // STOPWATCH
  // ******
  timers: StopwatchTimers;
  stopwatchMode: StopwatchMode;

  // ******
  // DASH
  // ******
  dashLifeCycle: DashLifeCycle;
  dashInfo: DashInfo;

  // ******
  // WEBSOCKET
  // ******
  wsConnectionStatus: DashWsConnectionStatus;
  wsRetryState: DashWsRetryState;

  // Store the sendMessage function
  _sendMessage: ((message: ExtensionMessage) => void) | null;
}

interface DashActions {
  // Setup
  setSendMessage(sendMessage: (message: ExtensionMessage) => void): void;

  // Dash lifecycle actions
  initDash(): void;
  completeDash(): void;
  cancelDash(): void;
  logEvent(event: Omit<DashEvent, 'timestamp'>): void;
  changeDashInfo(info: DashInfo): void;

  // Reaction to server payloads
  syncDash(payload: DashUpdatePayload): void;
}

type DashStore = DashState & DashActions;

const initialDashState: DashState = {
  events: [],
  timers: initialTimers,
  stopwatchMode: null,
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
  _sendMessage: null,
};

export const useDashStore = create<DashStore>((set, get) => ({
  // Initial state
  ...initialDashState,

  // Setup
  setSendMessage: (sendMessage: (message: ExtensionMessage) => void) => {
    set({ _sendMessage: sendMessage });
  },

  // Dash lifecycle actions
  initDash: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;
    _sendMessage(createExtensionMessage(ExtensionMessageType.DASH_INIT));
  },

  completeDash: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;
    _sendMessage(createExtensionMessage(ExtensionMessageType.DASH_COMPLETE));
  },

  cancelDash: () => {
    const { _sendMessage } = get();
    if (!_sendMessage) return;
    _sendMessage(createExtensionMessage(ExtensionMessageType.DASH_CANCEL));
  },

  logEvent: (event: Omit<DashEvent, 'timestamp'>) => {
    const { _sendMessage } = get();
    if (!_sendMessage) {
      console.warn('sendMessage not set in dash store');
      return;
    }

    const newEvent: DashEvent = { ...event, timestamp: Date.now() };
    _sendMessage(
      createExtensionMessage(ExtensionMessageType.DASH_EVENT, newEvent)
    );
  },

  changeDashInfo: (info: DashInfo) => {
    const { _sendMessage } = get();
    if (!_sendMessage) {
      console.warn('sendMessage not set in dash store');
      return;
    }
    _sendMessage(
      createExtensionMessage(ExtensionMessageType.DASH_INFO_CHANGE, info)
    );
  },

  syncDash: (payload: DashUpdatePayload) => {
    console.log('[dash-store] syncDash to: ', payload);
    set((state) => ({
      ...state,
      events: payload.events,
      timers: payload.timers,
      stopwatchMode: payload.stopwatchMode,
      dashLifeCycle: payload.dashLifeCycle,
      dashInfo: payload.dashInfo,
      wsConnectionStatus: payload.wsConnectionStatus,
      wsRetryState: payload.wsRetryState,
    }));
  },
}));

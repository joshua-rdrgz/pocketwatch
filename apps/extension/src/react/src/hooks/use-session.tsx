import {
  Event,
  EventType,
  EventVariants,
  PayloadOf,
  StopwatchMode,
  StopwatchTimers,
} from '@repo/shared/types/session';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useStopwatch } from './use-stopwatch';
import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessage,
  ExtensionMessageType,
  TypedExtensionMessage,
} from '@repo/shared/types/extension-connection';
import { usePortConnection } from './use-port-connection';

// Type for SESSION_UPDATE message payload
interface SessionUpdatePayload {
  events: Event[];
  hasSessionStarted: boolean;
  stopwatch: {
    timers: StopwatchTimers;
    mode: StopwatchMode;
  };
}

interface SessionContextType {
  // ******
  // EVENTS
  // ******
  events: Event[];
  logEvent<T extends EventType>(
    event: Omit<EventVariants<T>, 'timestamp'>
  ): void;
  clearEvents(): void;

  // ******
  // STOPWATCH
  // ******
  timers: StopwatchTimers;
  stopwatchMode: StopwatchMode;
  handleStopwatchStart(): void;
  handleStopwatchStop(): void;
  setStopwatchMode(mode: StopwatchMode): void;
  resetStopwatch(): void;

  // ******
  // MISC
  // ******
  isSessionFinished: boolean;
  handleUrlClick(payload: PayloadOf<'browser', 'website_visit'>): void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: React.PropsWithChildren) {
  const [events, setEvents] = useState<Event[]>([]);
  const { sendMessage } = usePortConnection();

  const stopwatch = useStopwatch({ sendMessage });

  // Listen for session updates from service worker
  useEffect(() => {
    const handleMessage = (event: CustomEvent<ExtensionMessage>) => {
      const msg = event.detail;
      if (msg.type === ExtensionMessageType.SESSION_UPDATE) {
        const sessionMsg = msg as TypedExtensionMessage<
          ExtensionMessageType.SESSION_UPDATE,
          SessionUpdatePayload
        >;
        setEvents(sessionMsg.payload.events || []);

        if (sessionMsg.payload.stopwatch?.timers) {
          stopwatch.setTimers(sessionMsg.payload.stopwatch.timers);
        }

        if (sessionMsg.payload.stopwatch?.mode !== undefined) {
          stopwatch.setSWMode(sessionMsg.payload.stopwatch.mode);
        }
      }
    };

    window.addEventListener('port-message', handleMessage as EventListener);

    return () => {
      window.removeEventListener(
        'port-message',
        handleMessage as EventListener
      );
    };
  }, [stopwatch]);

  const logEvent = useCallback(
    <T extends EventType>(event: Omit<EventVariants<T>, 'timestamp'>) => {
      const newEvent: Event = { ...event, timestamp: Date.now() } as Event;
      sendMessage(
        createExtensionMessage(ExtensionMessageType.SESSION_ADD_EVENT, newEvent)
      );
    },
    [sendMessage]
  );

  const clearEvents = useCallback(() => {
    sendMessage(
      createExtensionMessage(ExtensionMessageType.SESSION_CLEAR_EVENTS)
    );
  }, [sendMessage]);

  const isSessionFinished = useMemo(() => {
    return events.some(
      (ev) => ev.type === 'stopwatch' && ev.action === 'finish'
    );
  }, [events]);

  const handleUrlClick = useCallback(
    (payload: PayloadOf<'browser', 'website_visit'>) => {
      sendMessage(
        createExtensionMessage(
          ExtensionMessageType.SESSION_WEBSITE_VISIT,
          payload
        )
      );
    },
    [sendMessage]
  );

  const value: SessionContextType = {
    events,
    logEvent,
    clearEvents,
    isSessionFinished,
    handleUrlClick,
    ...stopwatch,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

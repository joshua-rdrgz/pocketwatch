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
  useRef,
  useState,
} from 'react';
import { useStopwatch } from './use-stopwatch';

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
  const portRef = useRef<chrome.runtime.Port | null>(null);

  const stopwatch = useStopwatch({ portRef });

  // Sync Service Worker w/UI State
  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'session' });
    portRef.current = port;

    // Listen for updates
    port.onMessage.addListener((msg) => {
      if (msg.type === 'update') {
        setEvents(msg.events || []);

        if (msg.timers) {
          stopwatch.setTimers(msg.timers);
        }

        if (msg.stopwatchMode !== undefined) {
          stopwatch.setSWMode(msg.stopwatchMode);
        }
      }
    });

    // Effect Clean Up
    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, [stopwatch]);

  const logEvent = useCallback(
    <T extends EventType>(event: Omit<EventVariants<T>, 'timestamp'>) => {
      const newEvent: Event = { ...event, timestamp: Date.now() } as Event;
      portRef.current?.postMessage({ action: 'addEvent', event: newEvent });
    },
    []
  );

  const clearEvents = useCallback(() => {
    portRef.current?.postMessage({ action: 'clearEvents' });
  }, []);

  const isSessionFinished = useMemo(() => {
    return events.some(
      (ev) => ev.type === 'stopwatch' && ev.action === 'finish'
    );
  }, [events]);

  const handleUrlClick = useCallback(
    (payload: PayloadOf<'browser', 'website_visit'>) => {
      portRef.current?.postMessage({ action: 'websiteVisit', payload });
    },
    []
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

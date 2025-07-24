import {
  Event,
  EventType,
  EventVariants,
  PayloadOf,
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
import { useTheme } from './use-theme';

type Theme = 'dark' | 'light' | 'system';

type EffectiveTheme = Omit<Theme, 'system'>;

interface AppSettingsContextType {
  effectiveTheme: EffectiveTheme;
  toggleTheme(): void;
  events: Event[];
  logEvent<T extends EventType>(
    event: Omit<EventVariants<T>, 'timestamp'>
  ): void;
  clearEvents(): void;
  isSessionFinished: boolean;
  handleUrlClick(payload: PayloadOf<'browser', 'website_visit'>): void;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({ children }: React.PropsWithChildren) {
  const [events, setEvents] = useState<Event[]>([]);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  const { effectiveTheme, setTheme, toggleTheme } = useTheme({
    onThemeChange: (theme) => {
      portRef.current?.postMessage({
        action: 'setTheme',
        value: theme,
      });
    },
  });

  // Sync Service Worker w/UI State
  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'appSettings' });
    portRef.current = port;

    // Listen for updates
    port.onMessage.addListener((msg) => {
      if (msg.type === 'update') {
        setTheme(msg.effectiveTheme);
        setEvents(msg.events || []);
      }
    });

    // Effect Clean Up
    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, [setTheme]);

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

  const value: AppSettingsContextType = {
    effectiveTheme,
    toggleTheme,
    events,
    logEvent,
    clearEvents,
    isSessionFinished,
    handleUrlClick,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within a AppSettingsProvider');
  }
  return context;
}

import { Event, EventType } from '@/types/event';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface AppSettingsContextType {
  hourlyRate: number;
  handleHourlyRateChange(rate: number): void;
  projectName: string;
  handleProjectNameChange(name: string): void;
  projectDescription: string;
  handleProjectDescriptionChange(description: string): void;
  events: Event[];
  logEvent<T extends EventType>(event: Omit<Event<T>, 'timestamp'>): void;
  clearEvents(): void;
  isSessionFinished: boolean;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({ children }: React.PropsWithChildren) {
  const [hourlyRate, setHourlyRate] = useState(25);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  // Sync Service Worker w/UI State
  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'appSettings' });
    portRef.current = port;

    // Listen for updates
    port.onMessage.addListener((msg) => {
      if (msg.type === 'update') {
        setHourlyRate(msg.hourlyRate);
        setProjectName(msg.projectName);
        setProjectDescription(msg.projectDescription);
        setEvents(msg.events || []);
      }
    });

    // Effect Clean Up
    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, []);

  const handleHourlyRateChange = useCallback((rate: number) => {
    portRef.current?.postMessage({ action: 'setHourlyRate', value: rate });
  }, []);

  const handleProjectNameChange = useCallback((projectName: string) => {
    portRef.current?.postMessage({
      action: 'setProjectName',
      value: projectName,
    });
  }, []);

  const handleProjectDescriptionChange = useCallback(
    (projectDescription: string) => {
      portRef.current?.postMessage({
        action: 'setProjectDescription',
        value: projectDescription,
      });
    },
    []
  );

  const logEvent = useCallback(
    <T extends EventType>(event: Omit<Event<T>, 'timestamp'>) => {
      const newEvent: Event = { ...event, timestamp: Date.now() };
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

  const value: AppSettingsContextType = {
    hourlyRate,
    handleHourlyRateChange,
    projectName,
    handleProjectNameChange,
    projectDescription,
    handleProjectDescriptionChange,
    events,
    logEvent,
    clearEvents,
    isSessionFinished,
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

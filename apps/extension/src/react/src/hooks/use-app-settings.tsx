import { AppMode } from '@/types/app';
import { Event, EventType } from '@/types/stopwatch';
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
  appMode: AppMode;
  handleAppModeChange(mode: AppMode): void;
  hourlyRate: number;
  handleHourlyRateChange(rate: number): void;
  projectName: string;
  handleProjectNameChange(name: string): void;
  projectDescription: string;
  handleProjectDescriptionChange(description: string): void;
  events: Event[];
  logEvent(type: EventType): void;
  clearEvents(): void;
  isSessionFinished: boolean;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({ children }: React.PropsWithChildren) {
  const [appMode, setAppMode] = useState<AppMode>('regular');
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
        setAppMode(msg.appMode);
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

  const handleAppModeChange = useCallback(
    (mode: AppMode) => {
      if (mode === appMode) return; // Prevent setting the same mode
      portRef.current?.postMessage({ action: 'setAppMode', value: mode });
    },
    [appMode]
  );

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

  const logEvent = useCallback((type: EventType) => {
    const newEvent: Event = { type, timestamp: Date.now() };
    portRef.current?.postMessage({ action: 'addEvent', event: newEvent });
  }, []);

  const clearEvents = useCallback(() => {
    portRef.current?.postMessage({ action: 'clearEvents' });
  }, []);

  const isSessionFinished = useMemo(() => {
    return events.some((ev) => ev.type === 'finish');
  }, [events]);

  const value: AppSettingsContextType = {
    appMode,
    handleAppModeChange,
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

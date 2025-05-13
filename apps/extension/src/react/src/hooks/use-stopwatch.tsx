import { initialTimers } from '@/lib/constants';
import { StopwatchMode } from '@/types/stopwatch';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface StopwatchContextType {
  timers: typeof initialTimers;
  stopwatchMode: StopwatchMode;
  handleStopwatchStart(): void;
  handleStopwatchStop(): void;
  setStopwatchMode(mode: StopwatchMode): void;
  resetStopwatch(): void;
}

const StopwatchContext = createContext<StopwatchContextType | null>(null);

export function StopwatchProvider({ children }: React.PropsWithChildren) {
  const [timers, setTimers] = useState(initialTimers);
  const [stopwatchMode, setSWMode] = useState<StopwatchMode>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  // Sync Service Worker w/UI State
  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'stopwatch' });
    portRef.current = port;

    // Listen for updates
    port.onMessage.addListener((msg) => {
      if (msg.type === 'update') {
        setTimers(msg.timers);
        setSWMode(msg.mode);
      }
    });

    // Effect Clean Up
    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, []);

  const handleStopwatchStart = useCallback(() => {
    portRef.current?.postMessage({
      action: 'start',
      initialTimes: timers,
    });
  }, [timers]);

  const handleStopwatchStop = useCallback(() => {
    portRef.current?.postMessage({ action: 'stop' });
  }, []);

  const setStopwatchMode = useCallback((mode: StopwatchMode) => {
    portRef.current?.postMessage({ action: 'setMode', mode });
  }, []);

  const resetStopwatch = useCallback(() => {
    portRef.current?.postMessage({ action: 'reset' });
  }, []);

  const value: StopwatchContextType = {
    timers,
    stopwatchMode,
    handleStopwatchStart,
    handleStopwatchStop,
    setStopwatchMode,
    resetStopwatch,
  };

  return (
    <StopwatchContext.Provider value={value}>
      {children}
    </StopwatchContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStopwatch() {
  const context = useContext(StopwatchContext);
  if (!context) {
    throw new Error('useStopwatch must be used within a StopwatchProvider');
  }
  return context;
}

import { initialTimers } from '@/lib/constants';
import { StopwatchMode } from '@/types/stopwatch';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useStopwatch() {
  const [timers, setTimers] = useState(initialTimers);
  const [currStopwatchMode, setCurrStopwatchMode] =
    useState<StopwatchMode>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  // Sync Service Worker w/UI State
  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'stopwatch' });
    portRef.current = port;

    // Listen for updates
    port.onMessage.addListener((msg) => {
      if (msg.type === 'update') {
        setTimers(msg.timers);
        setCurrStopwatchMode(msg.mode);
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

  return {
    timers,
    currStopwatchMode,
    handleStopwatchStart,
    handleStopwatchStop,
    setStopwatchMode,
    resetStopwatch,
  };
}

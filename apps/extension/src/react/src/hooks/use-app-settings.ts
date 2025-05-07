import { AppMode } from '@/types/app';
import { Event, EventType } from '@/types/stopwatch';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAppSettings() {
  const [appMode, setAppMode] = useState<AppMode>('regular');
  const [hourlyRate, setHourlyRate] = useState(25);
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

  const logEvent = useCallback((type: EventType) => {
    const newEvent: Event = { type, timestamp: Date.now() };
    portRef.current?.postMessage({ action: 'addEvent', event: newEvent });
  }, []);

  const clearEvents = useCallback(() => {
    portRef.current?.postMessage({ action: 'clearEvents' });
  }, []);

  return {
    appMode,
    hourlyRate,
    events,
    handleAppModeChange,
    handleHourlyRateChange,
    logEvent,
    clearEvents,
  };
}

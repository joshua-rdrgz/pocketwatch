import { initialTimers } from '@/lib/constants';
import { StopwatchMode } from '@repo/shared/types/session';
import { useCallback, useState } from 'react';

interface UseStopwatchProps {
  portRef: React.RefObject<chrome.runtime.Port | null>;
}

/**
 * NOTE: ONLY use this hook within SessionProvider.
 * If you're using it elsewhere, you're wrong!
 */
export function useStopwatch({ portRef }: UseStopwatchProps) {
  const [timers, setTimers] = useState(initialTimers);
  const [stopwatchMode, setSWMode] = useState<StopwatchMode>(null);

  const handleStopwatchStart = useCallback(() => {
    portRef.current?.postMessage({
      action: 'startTimer',
      initialTimes: timers,
    });
  }, [timers, portRef]);

  const handleStopwatchStop = useCallback(() => {
    portRef.current?.postMessage({ action: 'stopTimer' });
  }, [portRef]);

  const setStopwatchMode = useCallback(
    (mode: StopwatchMode) => {
      portRef.current?.postMessage({ action: 'setTimerMode', mode });
    },
    [portRef]
  );

  const resetStopwatch = useCallback(() => {
    portRef.current?.postMessage({ action: 'resetTimer' });
  }, [portRef]);

  return {
    timers,
    setTimers,
    stopwatchMode,
    setSWMode,
    handleStopwatchStart,
    handleStopwatchStop,
    setStopwatchMode,
    resetStopwatch,
  };
}

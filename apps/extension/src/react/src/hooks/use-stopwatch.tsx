import { initialTimers } from '@/lib/constants';
import { createMessage } from '@repo/shared/lib/connection';
import { Message, MessageType } from '@repo/shared/types/connection';
import { StopwatchMode } from '@repo/shared/types/session';
import { useCallback, useState } from 'react';

interface UseStopwatchProps {
  sendMessage: (message: Message) => void;
}

/**
 * NOTE: ONLY use this hook within SessionProvider.
 * If you're using it elsewhere, you're wrong!
 */
export function useStopwatch({ sendMessage }: UseStopwatchProps) {
  const [timers, setTimers] = useState(initialTimers);
  const [stopwatchMode, setSWMode] = useState<StopwatchMode>(null);

  const handleStopwatchStart = useCallback(() => {
    sendMessage(createMessage(MessageType.SESSION_START_TIMER));
  }, [sendMessage]);

  const handleStopwatchStop = useCallback(() => {
    sendMessage(createMessage(MessageType.SESSION_STOP_TIMER));
  }, [sendMessage]);

  const setStopwatchMode = useCallback(
    (mode: StopwatchMode) => {
      sendMessage(createMessage(MessageType.SESSION_SET_TIMER_MODE, mode));
    },
    [sendMessage]
  );

  const resetStopwatch = useCallback(() => {
    sendMessage(createMessage(MessageType.SESSION_RESET_TIMER));
  }, [sendMessage]);

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

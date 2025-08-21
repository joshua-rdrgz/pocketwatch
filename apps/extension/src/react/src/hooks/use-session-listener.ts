import { useEffect } from 'react';
import {
  ExtensionMessage,
  ExtensionMessageType,
  TypedExtensionMessage,
} from '@repo/shared/types/extension-connection';
import {
  Event,
  StopwatchMode,
  StopwatchTimers,
} from '@repo/shared/types/session';
import { useSessionStore } from '../stores/session-store';

// Type for SESSION_UPDATE message payload
interface SessionUpdatePayload {
  events: Event[];
  hasSessionStarted: boolean;
  stopwatch: {
    timers: StopwatchTimers;
    mode: StopwatchMode;
  };
}

/**
 * Custom hook that sets up the session message listener.
 * Listens for SESSION_UPDATE messages from the service worker and updates the Zustand store.
 */
export function useSessionListener() {
  const store = useSessionStore();

  useEffect(() => {
    const handleMessage = (event: CustomEvent<ExtensionMessage>) => {
      const msg = event.detail;
      if (msg.type === ExtensionMessageType.SESSION_UPDATE) {
        const sessionMsg = msg as TypedExtensionMessage<
          ExtensionMessageType.SESSION_UPDATE,
          SessionUpdatePayload
        >;
        store.updateFromSessionMessage(sessionMsg.payload);
      }
    };

    window.addEventListener('port-message', handleMessage as EventListener);

    return () => {
      window.removeEventListener(
        'port-message',
        handleMessage as EventListener
      );
    };
  }, [store]);
}

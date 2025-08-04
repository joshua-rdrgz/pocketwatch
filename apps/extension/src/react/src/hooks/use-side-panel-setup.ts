import { useEffect } from 'react';
import { createMessage } from '@repo/shared/lib/connection';
import { MessageType, PortName } from '@repo/shared/types/connection';

/**
 * Hook to set up the side panel communication with the service worker.
 * Handles connection establishment and cleanup.
 */
export function useSidePanelSetup() {
  useEffect(() => {
    let port: chrome.runtime.Port | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const portListener = (msg: any) => {
      if (msg.type === MessageType.SP_CLOSE) {
        window.close();
      }
    };

    // Register port on all active tabs in current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id && typeof tabs[0].windowId === 'number') {
        const windowId = tabs[0].windowId;
        const tabId = tabs[0].id;
        port = chrome.runtime.connect({ name: PortName.SP_POCKETWATCH });
        port.postMessage(
          createMessage(MessageType.SP_REGISTER_WINDOW, { windowId, tabId })
        );
        port.onMessage.addListener(portListener);
      }
    });

    // Cleanup function is needed to disconnect the port when the component unmounts.
    // This prevents memory leaks and ensures proper cleanup of the connection.
    // The service worker has an onDisconnect listener that will handle this event.
    return () => {
      if (port) {
        port.onMessage.removeListener(portListener);
        port.disconnect();
      }
    };
  }, []);
}

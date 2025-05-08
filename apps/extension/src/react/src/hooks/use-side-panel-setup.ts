/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';

/**
 * Hook to set up the side panel communication with the service worker.
 * Handles connection establishment and cleanup.
 */
export function useSidePanelSetup() {
  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'model-metrics-side-panel' });

    const handleMessage = (message: any) => {
      if (message.type === 'CLOSE_SIDE_PANEL') {
        window.close();
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      port.disconnect();
    };
  }, []);
}

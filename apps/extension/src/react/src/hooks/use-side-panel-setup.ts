/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';

/**
 * Hook to set up the side panel communication with the service worker.
 * Handles connection establishment and cleanup.
 */
export function useSidePanelSetup() {
  useEffect(() => {
    console.log('[Side Panel] Setting up connection to service worker');
    const port = chrome.runtime.connect({ name: 'model-metrics-side-panel' });
    console.log('[Side Panel] Connection established');

    const handleMessage = (message: any) => {
      console.log('[Side Panel] Received message:', message);
      if (message.type === 'CLOSE_SIDE_PANEL') {
        console.log('[Side Panel] Closing panel due to service worker request');
        window.close();
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    console.log('[Side Panel] Message listener registered');

    return () => {
      console.log('[Side Panel] Cleaning up connection and listeners');
      chrome.runtime.onMessage.removeListener(handleMessage);
      port.disconnect();
    };
  }, []);
}

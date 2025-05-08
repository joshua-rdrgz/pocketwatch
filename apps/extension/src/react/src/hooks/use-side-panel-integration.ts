import { useEffect, useState } from 'react';

/**
 * Hook to integrate the browser panel with side panel communications.
 * Tracks side panel state and provides methods to toggle it.
 */
export function useSidePanelIntegration() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log('[Side Panel Integration] Setting up integration');

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const handleMessage = (message: any) => {
      console.log('[Side Panel Integration] Received message:', message);
      if (message.type === 'SIDE_PANEL_STATE_CHANGED') {
        console.log('[Side Panel Integration] Updating state:', {
          isOpen: message.isOpen,
        });
        setIsOpen(message.isOpen);
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    console.log('[Side Panel Integration] Message listener registered');

    console.log('[Side Panel Integration] Requesting initial side panel state');
    chrome.runtime.sendMessage({ type: 'GET_SIDE_PANEL_STATE' }, (response) => {
      if (response) {
        console.log(
          '[Side Panel Integration] Received initial state:',
          response
        );
        setIsOpen(response.isOpen);
      }
    });

    return () => {
      console.log('[Side Panel Integration] Cleaning up listeners');
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const toggleSidePanel = () => {
    console.log('[Side Panel Integration] Toggling side panel');
    chrome.runtime.sendMessage({ type: 'TOGGLE_SIDE_PANEL' });
  };

  return { isOpen, toggleSidePanel };
}

import { useEffect, useState } from 'react';

/**
 * Hook to integrate the browser panel with side panel communications.
 * Tracks side panel state and provides methods to toggle it.
 */
export function useSidePanelIntegration() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const handleMessage = (message: any) => {
      if (message.type === 'SIDE_PANEL_STATE_CHANGED') {
        setIsOpen(message.isOpen);
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    chrome.runtime.sendMessage({ type: 'GET_SIDE_PANEL_STATE' }, (response) => {
      if (response) {
        setIsOpen(response.isOpen);
      }
    });

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const toggleSidePanel = () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_SIDE_PANEL' });
  };

  return { isOpen, toggleSidePanel };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';

/**
 * Hook to integrate the browser panel with side panel communications.
 * Tracks side panel state and provides methods to toggle it.
 */
export function useSidePanelIntegration() {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  useEffect(() => {
    const sidePanelStateListener = (msg: any) => {
      if (msg.type === 'SIDE_PANEL_STATE_CHANGED') {
        setIsSidePanelOpen(msg.isOpen);
      }
    };

    // Listen for state changes from service worker
    chrome.runtime.onMessage.addListener(sidePanelStateListener);

    // Request initial state of side panel
    chrome.runtime.sendMessage({ type: 'GET_SIDE_PANEL_STATE' }, (res) => {
      if (res) {
        setIsSidePanelOpen(res.isOpen);
      }
    });

    return () => {
      chrome.runtime.onMessage.removeListener(sidePanelStateListener);
    };
  }, []);

  const toggleSidePanel = () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_SIDE_PANEL' });
  };

  return { isSidePanelOpen, toggleSidePanel };
}

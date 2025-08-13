/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { createExtensionMessage } from '@repo/shared/lib/connection';
import { ExtensionMessageType } from '@repo/shared/types/connection';

/**
 * Hook to integrate the browser panel with side panel communications.
 * Tracks side panel state and provides methods to toggle it.
 */
export function useSidePanelIntegration() {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  useEffect(() => {
    const sidePanelStateListener = (msg: any) => {
      if (msg.type === ExtensionMessageType.SP_STATE_CHANGED) {
        setIsSidePanelOpen(msg.payload.isOpen);
      }
    };

    // Listen for state changes from service worker
    chrome.runtime.onMessage.addListener(sidePanelStateListener);

    // Request initial state of side panel
    chrome.runtime.sendMessage(
      createExtensionMessage(ExtensionMessageType.SP_GET_STATE),
      (res) => {
        if (res && res.isOpen !== undefined) {
          setIsSidePanelOpen(res.isOpen);
        }
      }
    );

    return () => {
      chrome.runtime.onMessage.removeListener(sidePanelStateListener);
    };
  }, []);

  const toggleSidePanel = () => {
    chrome.runtime.sendMessage(
      createExtensionMessage(ExtensionMessageType.SP_TOGGLE)
    );
  };

  return { isSidePanelOpen, toggleSidePanel };
}

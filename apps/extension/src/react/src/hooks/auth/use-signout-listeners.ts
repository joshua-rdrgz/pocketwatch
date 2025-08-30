import { useEffect } from 'react';
import { ExtensionMessageType } from '@repo/shared/types/extension-connection';

export function useSignoutListeners() {
  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg) => {
      switch (msg.type) {
        case ExtensionMessageType.AUTH_SIGNOUT_SUCCESSFUL:
          window.location.reload();
      }
    });
  }, []);
}

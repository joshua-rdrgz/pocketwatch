import { useEffect } from 'react';
import { MessageType } from '@repo/shared/types/connection';

export function useSignoutListeners() {
  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg) => {
      switch (msg.type) {
        case MessageType.AUTH_SIGNOUT_SUCCESSFUL:
          window.location.reload();
      }
    });
  }, []);
}

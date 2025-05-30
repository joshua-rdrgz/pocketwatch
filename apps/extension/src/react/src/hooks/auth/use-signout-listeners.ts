import { useEffect } from 'react';

export function useSignoutListeners() {
  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg) => {
      switch (msg.type) {
        case 'SIGNOUT_SUCCESSFUL':
          window.location.reload();
      }
    });
  }, []);
}

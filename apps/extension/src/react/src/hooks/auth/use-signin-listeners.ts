import { useEffect, useState } from 'react';

export function useSigninListeners() {
  const [oauthLoading, setOAuthLoading] = useState(false);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg) => {
      switch (msg.type) {
        case 'SET_OAUTH_LOADING':
          setOAuthLoading(msg.payload);
          break;
        case 'SIGNIN_SUCCESSFUL':
          window.location.reload();
          break;
      }
    });
  }, []);

  return { oauthLoading };
}

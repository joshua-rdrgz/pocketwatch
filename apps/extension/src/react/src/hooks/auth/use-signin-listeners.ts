import { ExtensionMessageType } from '@repo/shared/types/extension-connection';
import { useEffect, useState } from 'react';

interface UseSigninListenersOptions {
  onSigninSuccess?: () => void;
}

export function useSigninListeners(options?: UseSigninListenersOptions) {
  const [oauthLoading, setOAuthLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (msg: any) => {
      switch (msg.type) {
        case ExtensionMessageType.AUTH_SET_OAUTH_LOADING:
          setOAuthLoading(msg.payload);
          break;
        case ExtensionMessageType.AUTH_SIGNIN_SUCCESSFUL:
          if (options?.onSigninSuccess) {
            options.onSigninSuccess();
          } else {
            window.location.reload();
          }
          break;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [options]);

  return { oauthLoading };
}

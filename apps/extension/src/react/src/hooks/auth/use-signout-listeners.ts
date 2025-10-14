import { useEffect } from 'react';
import { ExtensionMessageType } from '@repo/shared/types/extension-connection';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useSignoutListeners() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (msg: any) => {
      switch (msg.type) {
        case ExtensionMessageType.AUTH_SIGNOUT_SUCCESSFUL:
          toast.success('Successfully signed out. See you later!');
          queryClient.invalidateQueries({ queryKey: ['user-session'] });
          break;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [queryClient]);
}

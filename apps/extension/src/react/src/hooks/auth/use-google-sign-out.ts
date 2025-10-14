import { createExtensionMessage } from '@repo/shared/lib/connection';
import { ExtensionMessageType } from '@repo/shared/types/extension-connection';
import { useMutation } from '@tanstack/react-query';

export function useGoogleSignOut() {
  return useMutation({
    mutationKey: ['google-sign-out'],
    mutationFn: async () => {
      const res = await chrome.runtime.sendMessage(
        createExtensionMessage(ExtensionMessageType.AUTH_GOOGLE_SIGN_OUT)
      );

      if (!res.success) {
        throw res.error;
      }

      return res;
    },
  });
}

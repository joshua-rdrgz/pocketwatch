import { createExtensionMessage } from '@repo/shared/lib/connection';
import { ExtensionMessageType } from '@repo/shared/types/extension-connection';
import { useMutation } from '@tanstack/react-query';

export function useGoogleSignIn() {
  return useMutation({
    mutationKey: ['google-sign-in'],
    mutationFn: async () => {
      const res = await chrome.runtime.sendMessage(
        createExtensionMessage(ExtensionMessageType.AUTH_GOOGLE_SIGN_IN)
      );

      if (!res.success) {
        throw res.error;
      }

      return res;
    },
  });
}

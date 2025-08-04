import { createMessage } from '@repo/shared/lib/connection';
import { MessageType } from '@repo/shared/types/connection';
import { useMutation } from '@tanstack/react-query';

export function useGoogleSignIn() {
  return useMutation({
    mutationKey: ['google-sign-in'],
    mutationFn: async () => {
      const res = await chrome.runtime.sendMessage(
        createMessage(MessageType.AUTH_GOOGLE_SIGN_IN)
      );

      if (!res.success) {
        throw res.error;
      }

      return res;
    },
  });
}

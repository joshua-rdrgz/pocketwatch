import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

type GoogleSignOutSuccess = {
  success: true;
  message: string;
  redirectUrl: string;
};

type GoogleSignOutFailure = {
  success: false;
  error: Error;
};

type GoogleSignOut = GoogleSignOutSuccess | GoogleSignOutFailure;

export function useGoogleSignOut() {
  const navigate = useNavigate();

  return useMutation({
    mutationKey: ['google-sign-out'],
    mutationFn: async () => {
      const res: GoogleSignOut = await chrome.runtime.sendMessage({
        type: 'GOOGLE_SIGN_OUT',
      });

      if (!res.success) {
        throw res.error;
      }

      return res;
    },
    onSuccess(data) {
      toast.success(data.message);
      navigate(data.redirectUrl);
    },
  });
}

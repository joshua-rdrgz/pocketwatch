import { useQuery } from '@tanstack/react-query';
import { Session, User } from 'better-auth/types';

type UserSessionSuccess = {
  success: true;
  data: {
    user: User;
    session: Session;
  };
};

type UserSessionFailure = {
  success: false;
  error: Error;
};

type UserSession = UserSessionSuccess | UserSessionFailure;

export function useUserSession() {
  return useQuery<UserSessionSuccess['data']>({
    queryKey: ['user-session'],
    queryFn: async () => {
      const res: UserSession = await chrome.runtime.sendMessage({
        type: 'GET_USER_SESSION',
      });

      if (!res.success) {
        throw res.error;
      }

      return res.data;
    },
  });
}

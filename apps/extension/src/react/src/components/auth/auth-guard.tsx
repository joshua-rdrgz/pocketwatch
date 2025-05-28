import { authClient } from '@/config/auth';
import { Navigate, Outlet } from 'react-router';

export const AuthGuard = () => {
  const { data, isPending, error } = authClient.useSession();

  if (isPending) {
    return <div>loading...</div>;
  }

  if (error) {
    throw new Error(error.message);
  }

  return data ? <Outlet /> : <Navigate to="/login" />;
};

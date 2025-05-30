import { useUserSession } from '@/hooks/auth/use-user-session';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Navigate, Outlet } from 'react-router';

export const AuthGuard = () => {
  const { data, isPending } = useUserSession();

  if (isPending) {
    return <LoadingSpinner />;
  }

  return data?.session ? <Outlet /> : <Navigate to="/login" />;
};

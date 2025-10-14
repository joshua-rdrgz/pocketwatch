import { useSigninListeners } from '@/hooks/auth/use-signin-listeners';
import { useGoogleSignIn } from '@/hooks/auth/use-google-sign-in';
import { LoginForm } from '@repo/ui/components/login-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

export function SPLoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: handleGoogleSignIn, isPending } = useGoogleSignIn();
  const { oauthLoading } = useSigninListeners({
    onSigninSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['user-session'] });
      toast.success('Welcome back!');
      navigate('/home');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm
          onGoogleSignIn={handleGoogleSignIn}
          isLoading={isPending || oauthLoading}
        />
      </div>
    </div>
  );
}

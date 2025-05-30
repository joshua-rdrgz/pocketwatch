import { useSigninListeners } from '@/hooks/auth/use-signin-listeners';
import { useGoogleSignIn } from '@/hooks/auth/use-google-sign-in';
import { LoginForm } from '@repo/ui/components/login-form';

export function SPLoginPage() {
  const { mutate: handleGoogleSignIn, isPending } = useGoogleSignIn();
  const { oauthLoading } = useSigninListeners();

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

import { useGoogleSignIn } from '@/hooks/use-google-signin';
import { LoginForm } from '@repo/ui/components/login-form';

export function SPLoginPage() {
  const { handleGoogleSignIn, isPending } = useGoogleSignIn();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm onGoogleSignIn={handleGoogleSignIn} isLoading={isPending} />
      </div>
    </div>
  );
}

import { useUserSession } from '@/hooks/auth/use-user-session';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StopwatchDisplay } from './stopwatch-display';
import { StopwatchToolbar } from './stopwatch-toolbar';
import { useSigninListeners } from '@/hooks/auth/use-signin-listeners';
import { useSignoutListeners } from '@/hooks/auth/use-signout-listeners';

export function BrowserPanel() {
  const { data, isPending } = useUserSession();
  const { oauthLoading } = useSigninListeners();
  useSignoutListeners();

  if (oauthLoading || isPending) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data?.session) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-sm text-muted-foreground">
        Please log in to continue
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <StopwatchDisplay />
      </div>

      {/* Bottom toolbar */}
      <StopwatchToolbar />
    </div>
  );
}

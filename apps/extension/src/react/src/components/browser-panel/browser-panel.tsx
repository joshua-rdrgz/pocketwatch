import { useUserSession } from '@/hooks/auth/use-user-session';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StopwatchStats } from './stopwatch-stats';
import { StopwatchActions } from './stopwatch-actions';
import { useSigninListeners } from '@/hooks/auth/use-signin-listeners';
import { useSignoutListeners } from '@/hooks/auth/use-signout-listeners';

interface BrowserPanelProps {
  primaryBtnHovered: boolean;
  onPrimaryBtnHovered(isHovered: boolean): void;
}

export function BrowserPanel({
  primaryBtnHovered,
  onPrimaryBtnHovered,
}: BrowserPanelProps) {
  const { data, isPending } = useUserSession();

  const { oauthLoading } = useSigninListeners();
  useSignoutListeners();

  if (oauthLoading || isPending) {
    return <LoadingSpinner />;
  }

  if (!data?.session) {
    return <div>uh oh, you gotta login!</div>;
  }

  return (
    <>
      {/* Left container - fills available space */}
      <StopwatchStats />
      {/* Right container - only takes required space */}
      <StopwatchActions
        primaryBtnHovered={primaryBtnHovered}
        onPrimaryBtnHovered={(isHovered) => onPrimaryBtnHovered(isHovered)}
      />
    </>
  );
}

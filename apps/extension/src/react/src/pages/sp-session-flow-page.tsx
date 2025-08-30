import { SessionActivePage } from '@/components/side-panel/session/session-active-page';
import { SessionCompletedPage } from '@/components/side-panel/session/session-completed-page';
import { SessionSetupPage } from '@/components/side-panel/session/session-setup-page';
import { useSessionStore } from '@/stores/session-store';

export function SPSessionFlowPage() {
  const sessionLifeCycle = useSessionStore((state) => state.sessionLifeCycle);
  const isNotActiveOrComplete =
    sessionLifeCycle !== 'active' && sessionLifeCycle !== 'completed';

  return (
    <div>
      {isNotActiveOrComplete && <SessionSetupPage />}
      {sessionLifeCycle === 'active' && <SessionActivePage />}
      {sessionLifeCycle === 'completed' && <SessionCompletedPage />}
    </div>
  );
}

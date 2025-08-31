import { useSessionStore } from '@/stores/session-store';
import { SessionInitializer } from './idle/session-initializer';
import { SessionActions } from './idle/session-actions';

export function SessionSetupPage() {
  const { sessionLifeCycle } = useSessionStore();

  // Show initializer when session is idle
  if (sessionLifeCycle === 'idle') {
    return (
      <div className="p-4 space-y-6">
        <SessionInitializer />
      </div>
    );
  }

  // Show session actions when session is initialized
  return (
    <div className="p-4 space-y-6">
      <SessionActions />
    </div>
  );
}

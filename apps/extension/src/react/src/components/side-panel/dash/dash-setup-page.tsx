import { useDashStore } from '@/stores/dash-store';
import { DashInitializer } from './idle/dash-initializer';
import { DashActions } from './idle/dash-actions';

export function DashSetupPage() {
  const { dashLifeCycle } = useDashStore();

  // Show initializer when dash is idle
  if (dashLifeCycle === 'idle') {
    return (
      <div className="p-4 space-y-6">
        <DashInitializer />
      </div>
    );
  }

  // Show dash actions when dash is initialized
  return (
    <div className="p-4 space-y-6">
      <DashActions />
    </div>
  );
}

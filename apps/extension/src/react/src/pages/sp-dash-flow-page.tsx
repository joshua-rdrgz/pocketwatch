import { DashActivePage } from '@/components/side-panel/dash/dash-active-page';
import { DashCompletedPage } from '@/components/side-panel/dash/dash-completed-page';
import { DashSetupPage } from '@/components/side-panel/dash/dash-setup-page';
import { useDashStore } from '@/stores/dash-store';

export function SPDashFlowPage() {
  const dashLifeCycle = useDashStore((state) => state.dashLifeCycle);
  const isNotActiveOrComplete =
    dashLifeCycle !== 'active' && dashLifeCycle !== 'completed';

  return (
    <div>
      {isNotActiveOrComplete && <DashSetupPage />}
      {dashLifeCycle === 'active' && <DashActivePage />}
      {dashLifeCycle === 'completed' && <DashCompletedPage />}
    </div>
  );
}

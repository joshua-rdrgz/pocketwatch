import { DashActivePage } from '@/components/side-panel/dash/dash-active-page';
import { DashCompletedPage } from '@/components/side-panel/dash/dash-completed-page';
import { DashSetupPage } from '@/components/side-panel/dash/dash-setup-page';
import { useDashStore } from '@/stores/dash-store';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function SPDashFlowPage() {
  const dashLifeCycle = useDashStore((state) => state.dashLifeCycle);
  const navigate = useNavigate();

  /**
   * If No Dash Exists,
   * Redirect to /home page
   */
  useEffect(() => {
    if (dashLifeCycle === null) {
      navigate('/home');
    }
  }, [dashLifeCycle, navigate]);

  // Don't render anything while redirecting
  if (dashLifeCycle === null) {
    return null;
  }

  return (
    <div>
      {dashLifeCycle === 'initialized' && <DashSetupPage />}
      {dashLifeCycle === 'active' && <DashActivePage />}
      {dashLifeCycle === 'completed' && <DashCompletedPage />}
    </div>
  );
}

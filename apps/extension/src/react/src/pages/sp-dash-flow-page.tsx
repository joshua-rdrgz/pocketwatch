import { DashActivePage } from '@/components/side-panel/dash/dash-active-page';
import { DashCompletedPage } from '@/components/side-panel/dash/dash-completed-page';
import { DashSetupPage } from '@/components/side-panel/dash/dash-setup-page';
import { useDashStore } from '@/stores/dash-store';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function SPDashFlowPage() {
  const doesDashExist = useDashStore((state) => state.doesDashExist);
  const dashLifeCycle = useDashStore((state) => state.dashLifeCycle);
  const navigate = useNavigate();

  // Redirect to home if no dash exists
  useEffect(() => {
    if (!doesDashExist()) {
      navigate('/home');
    }
  }, [doesDashExist, navigate]);

  // Don't render anything while redirecting
  if (!doesDashExist()) {
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

import { useDashStore } from '@/stores/dash-store';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function SPHomePage() {
  const dashLifeCycle = useDashStore((state) => state.dashLifeCycle);
  const navigate = useNavigate();

  /**
   * If Dash Exists,
   * Redirect to /dash page
   */
  useEffect(() => {
    if (dashLifeCycle !== null) {
      navigate('/dash');
    }
  }, [dashLifeCycle, navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Welcome to Pocketwatch
        </h1>
        <p className="text-muted-foreground">Your productivity dashboard</p>
      </div>
    </div>
  );
}

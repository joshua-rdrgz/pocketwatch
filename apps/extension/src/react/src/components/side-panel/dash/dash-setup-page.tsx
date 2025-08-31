import { useDashStore } from '@/stores/dash-store';
import { Button } from '@repo/ui/components/button';
import { useNavigate } from 'react-router';

export function DashSetupPage() {
  const { cancelDash, logEvent } = useDashStore();
  const navigate = useNavigate();

  const handleCancelDash = () => {
    cancelDash();
    navigate('/home');
  };

  return (
    <div className="p-4 space-y-6">
      <Button
        variant="destructive"
        onClick={handleCancelDash}
        className="w-full"
      >
        Cancel Dash
      </Button>

      <Button
        onClick={() =>
          logEvent({
            action: 'start',
          })
        }
        className="w-full"
      >
        Start Dash
      </Button>
    </div>
  );
}

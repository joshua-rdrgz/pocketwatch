import { Button } from '@repo/ui/components/button';
import { useDashStore } from '@/stores/dash-store';

export function DashActions() {
  const { cancelDash, logEvent } = useDashStore();

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          onClick={cancelDash}
          className="flex-1"
        >
          Cancel Dash
        </Button>
      </div>
      <Button
        onClick={() =>
          logEvent({
            type: 'stopwatch',
            action: 'start',
          })
        }
        className="w-full"
      >
        Start Dash
      </Button>
    </>
  );
}

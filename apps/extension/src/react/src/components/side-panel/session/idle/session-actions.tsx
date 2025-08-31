import { Button } from '@repo/ui/components/button';
import { useSessionStore } from '@/stores/session-store';

export function SessionActions() {
  const { cancelSession, logEvent } = useSessionStore();

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          onClick={cancelSession}
          className="flex-1"
        >
          Cancel Session
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
        Start Session
      </Button>
    </>
  );
}

import { Button } from '@repo/ui/components/button';
import { useSessionStore } from '@/stores/session-store';

interface SessionActionsProps {
  hasAssignedTask: boolean;
}

export function SessionActions({ hasAssignedTask }: SessionActionsProps) {
  const { unassignTask, cancelSession, logEvent } = useSessionStore();

  return (
    <>
      <div className="flex gap-2">
        {hasAssignedTask && (
          <Button variant="outline" onClick={unassignTask} className="flex-1">
            Unassign Task
          </Button>
        )}
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
      >
        Start Session
      </Button>
    </>
  );
}

import { useSessionStore } from '@/stores/session-store';
import { SessionInitializer } from './idle/session-initializer';
import { TaskSelector } from './idle/task-selector';
import { AssignedTaskDisplay } from './idle/assigned-task-display';
import { SessionActions } from './idle/session-actions';

export function SessionSetupPage() {
  const { sessionLifeCycle, assignedTaskId } = useSessionStore();

  // Show initializer when session is idle
  if (sessionLifeCycle === 'idle') {
    return (
      <div className="p-4 space-y-6">
        <SessionInitializer />
      </div>
    );
  }

  // Show task management when session is initialized
  const hasAssignedTask = !!assignedTaskId;

  return (
    <div className="p-4 space-y-6">
      {hasAssignedTask ? (
        <AssignedTaskDisplay taskId={assignedTaskId} />
      ) : (
        <TaskSelector />
      )}

      <SessionActions hasAssignedTask={hasAssignedTask} />
    </div>
  );
}

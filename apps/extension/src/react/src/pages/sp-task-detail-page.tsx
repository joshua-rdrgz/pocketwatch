import { BackButton } from '@/components/side-panel/back-button';
import { SubtasksList } from '@/components/side-panel/subtasks/subtasks-list';
import { TaskInfo } from '@/components/side-panel/tasks/task-info';
import { useNavigate, useParams } from 'react-router';

export function SPTaskDetailPage() {
  const { id: projectId, taskId } = useParams<{ id: string; taskId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/projects/${projectId}`);
  };

  // Error state
  if (!projectId || !taskId) {
    return (
      <div className="p-4 space-y-6">
        <BackButton onClick={handleBack} />
        <div className="py-8 text-center text-muted-foreground">
          <h2 className="text-lg font-medium">No task specified!</h2>
          <p className="mt-2">Please go back and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Task Information */}
      <TaskInfo taskId={taskId} onBack={handleBack} />

      {/* Subtasks Section */}
      <SubtasksList taskId={taskId} onBack={handleBack} />
    </div>
  );
}

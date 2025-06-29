import { BackButton } from '@/components/side-panel/back-button';
import { SubtasksCard } from '@/components/side-panel/subtasks/subtasks-card';
import { TaskInfo } from '@/components/side-panel/tasks/task-info';
import { Card, CardContent } from '@repo/ui/components/card';
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
        <BackButton onClick={handleBack} label="Back to Project" />
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <h2 className="text-lg font-medium">No task specified!</h2>
              <p className="mt-2">Please go back and try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <BackButton onClick={handleBack} label="Back to Project" />
      </div>

      {/* Task Information */}
      <TaskInfo taskId={taskId} />

      {/* Subtasks Section */}
      <SubtasksCard taskId={taskId} />
    </div>
  );
}

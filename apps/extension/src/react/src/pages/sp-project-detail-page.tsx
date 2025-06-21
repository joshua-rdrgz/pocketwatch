import { BackButton } from '@/components/side-panel/back-button';
import { ProjectInfo } from '@/components/side-panel/projects/project-info';
import { ProjectTaskList } from '@/components/side-panel/projects/project-task-list';
import { Card, CardContent } from '@repo/ui/components/card';
import { useNavigate, useParams } from 'react-router';

export function SPProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/projects');
  };

  // Error state
  if (!projectId) {
    return (
      <div className="p-4 space-y-6">
        <BackButton onClick={handleBack} label="Back to Projects" />
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <h2 className="text-lg font-medium">No project specified!</h2>
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
        <BackButton onClick={handleBack} label="Back to Projects" />
      </div>

      {/* Project Information */}
      <ProjectInfo projectId={projectId} />

      {/* Tasks Section */}
      <ProjectTaskList projectId={projectId} />
    </div>
  );
}

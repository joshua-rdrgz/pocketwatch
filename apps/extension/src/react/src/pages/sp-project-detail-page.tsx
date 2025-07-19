import { BackButton } from '@/components/side-panel/back-button';
import { ProjectInfo } from '@/components/side-panel/projects/project-info';
import { ProjectTaskList } from '@/components/side-panel/projects/project-task-list';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

export type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'complete';

export function SPProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const handleBack = () => {
    navigate('/projects');
  };

  const handleStatusFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
  };

  // Error state
  if (!projectId) {
    return (
      <div className="p-4 space-y-6">
        <BackButton onClick={handleBack} />
        <div className="py-8 text-center text-muted-foreground">
          <h2 className="text-lg font-medium">No project specified!</h2>
          <p className="mt-2">Please go back and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Project Information */}
      <ProjectInfo
        projectId={projectId}
        onBack={handleBack}
        onStatusFilterChange={handleStatusFilterChange}
      />

      {/* Tasks Section */}
      <ProjectTaskList projectId={projectId} statusFilter={statusFilter} />
    </div>
  );
}

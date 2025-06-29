import { ProjectsList } from '@/components/side-panel/projects/projects-list';
import { ProjectDrawer } from '@/components/side-panel/projects/project-drawer';
import { useState } from 'react';

export function SPProjectsPage() {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  const handleAddProject = () => {
    setIsCreateDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-muted-foreground mb-4">Projects</h1>

      <ProjectsList onAddProject={handleAddProject} />

      <ProjectDrawer
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
      />
    </div>
  );
}

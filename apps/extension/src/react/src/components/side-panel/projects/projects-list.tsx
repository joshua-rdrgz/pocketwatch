import { useProject } from '@/hooks/projects/use-project';
import { useProjects } from '@/hooks/projects/use-projects';
import { Button } from '@repo/ui/components/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { DeleteProjectDialog } from './delete-project-dialog';
import { ProjectCard } from './project-card';
import { ProjectDrawer } from './project-drawer';

export function ProjectsList() {
  const { data: projectsResponse, isLoading, error } = useProjects();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch full project details when editing
  const { data: selectedProjectResponse } = useProject(selectedProjectId || '');

  const projects =
    projectsResponse?.status === 'success'
      ? projectsResponse.data.projects
      : [];

  const handleEdit = (projectId: string) => {
    setSelectedProjectId(projectId);
    setDrawerOpen(true);
  };

  const handleDelete = (project: { id: string; name: string }) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleAddProject = () => {
    setSelectedProjectId(null);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedProjectId(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load projects
      </div>
    );
  }

  const selectedProject =
    selectedProjectResponse?.status === 'success'
      ? selectedProjectResponse.data.project
      : null;

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={() => handleEdit(project.id)}
          onDelete={() => handleDelete({ id: project.id, name: project.name })}
        />
      ))}

      <Button
        variant="ghost"
        className="w-full text-muted-foreground hover:text-foreground"
        onClick={handleAddProject}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Project
      </Button>

      <ProjectDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerClose}
        project={selectedProject}
      />

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={projectToDelete}
      />
    </div>
  );
}

import { ProjectCard } from '@/components/side-panel/projects/project-card';
import { useProjects } from '@/hooks/projects/use-projects';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Plus } from 'lucide-react';

interface ProjectsListProps {
  onAddProject: () => void;
}

export function ProjectsList({ onAddProject }: ProjectsListProps) {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        <h2 className="text-lg font-medium mb-2">Failed to load projects</h2>
        <p className="text-sm text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <h2 className="text-lg font-medium mb-2">No projects yet</h2>
        <p className="text-sm mb-4">
          Create your first project to start organizing your tasks.
        </p>
        <Button variant="default" className="mx-auto" onClick={onAddProject}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}

      <Button
        variant="ghost"
        className="w-full text-muted-foreground hover:text-foreground"
        onClick={onAddProject}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Project
      </Button>
    </div>
  );
}

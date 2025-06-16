import { ProjectsList } from '@/components/side-panel/projects/projects-list';

export function SPProjectsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-muted-foreground mb-4">Projects</h1>
      <ProjectsList />
    </div>
  );
}

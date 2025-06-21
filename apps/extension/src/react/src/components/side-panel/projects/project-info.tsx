import { useProject } from '@/hooks/projects/use-project';
import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { DollarSign } from 'lucide-react';
import { BillableBadge } from '../billable-badge';

interface ProjectInfoProps {
  projectId: string;
}

export function ProjectInfo({ projectId }: ProjectInfoProps) {
  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useProject(projectId || '');

  if (isProjectLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between gap-2 min-[400px]:gap-3">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!project || isProjectError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <h2 className="text-lg font-medium">
              The project could not be loaded.
            </h2>
            <p className="mt-2">
              It either wasn&apos;t found or couldn&apos;t be loaded. Please try
              again!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between gap-2 min-[400px]:gap-3">
          <h1 className="text-lg font-bold">{project.name}</h1>
          <div className="flex flex-wrap items-center justify-start min-[400px]:justify-end gap-2">
            <BillableBadge isBillable={project.defaultBillable} />
            {project.defaultBillable && (
              <div className="flex items-center gap-1.5 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">${project.defaultRate}/hr</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {project.description}
        </p>
      </CardContent>
    </Card>
  );
}

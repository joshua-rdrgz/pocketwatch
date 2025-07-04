import { useProject } from '@/hooks/projects/use-project';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { DollarSign, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BillableBadge } from '../billable-badge';
import { DeleteProjectDialog } from './delete-project-dialog';
import { ProjectDrawer } from './project-drawer';
import { useNavigate } from 'react-router';

interface ProjectInfoProps {
  projectId: string;
}

export function ProjectInfo({ projectId }: ProjectInfoProps) {
  const navigate = useNavigate();

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);

  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useProject(projectId || '');

  if (isProjectLoading) {
    return (
      <>
        <div className="flex justify-end gap-2 mb-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
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
      </>
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
    <>
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditDrawerOpen(true)}
          className="h-8 px-3"
        >
          <Edit className="h-3 w-3 mr-1.5" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDeleteDrawerOpen(true)}
          className="h-8 px-3 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3 mr-1.5" />
          Delete
        </Button>
      </div>

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

      <ProjectDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        projectId={projectId}
      />

      <DeleteProjectDialog
        open={isDeleteDrawerOpen}
        onOpenChange={setIsDeleteDrawerOpen}
        projectId={projectId}
        onDeleteSuccess={() => navigate(-1)}
      />
    </>
  );
}

import { useProject } from '@/hooks/projects/use-project';
import { StatusFilter } from '@/pages/sp-project-detail-page';
import { Button } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Skeleton } from '@repo/ui/components/skeleton';
import { DollarSign, Edit, Filter, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BackButton } from '../back-button';
import { BillableBadge } from '../billable-badge';
import { DeleteProjectDialog } from './delete-project-dialog';
import { ProjectDrawer } from './project-drawer';

interface ProjectInfoProps {
  projectId: string;
  onBack: () => void;
  onStatusFilterChange?: (filter: StatusFilter) => void;
}

export function ProjectInfo({
  projectId,
  onBack,
  onStatusFilterChange,
}: ProjectInfoProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);

  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useProject(projectId || '');

  const handleStatusFilterChange = (filter: StatusFilter) => {
    onStatusFilterChange?.(filter);
  };

  if (isProjectLoading) {
    return (
      <div className="flex items-start justify-between gap-4 w-full">
        {/* Left icon */}
        <Skeleton className="h-8 w-8 flex-shrink-0" />
        {/* Center content */}
        <div className="flex flex-col items-center flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full max-w-xs" />
          <Skeleton className="h-4 w-3/4 max-w-xs" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        {/* Right icon */}
        <Skeleton className="h-8 w-8 flex-shrink-0" />
      </div>
    );
  }

  if (!project || isProjectError) {
    return (
      <div className="space-y-4">
        <BackButton onClick={onBack} />
        <div className="py-8 text-center text-muted-foreground">
          <h2 className="text-lg font-medium">
            The project could not be loaded.
          </h2>
          <p className="mt-2">
            It either wasn&apos;t found or couldn&apos;t be loaded. Please try
            again!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4 w-full">
        {/* Left icon */}
        <div className="flex flex-col items-center">
          <BackButton onClick={onBack} />
        </div>
        {/* Center content */}
        <div className="flex flex-col items-center flex-1 space-y-2 min-w-0">
          <h1
            className="text-xl font-bold w-full text-center break-words"
            style={{ wordBreak: 'break-word' }}
          >
            {project.name}
          </h1>
          <div className="hidden min-[400px]:flex flex-col items-center w-full space-y-2">
            <p className="text-muted-foreground text-sm leading-relaxed w-full max-w-xs text-center break-words">
              {project.description}
            </p>
            {project.defaultBillable && (
              <div className="flex gap-3 mt-2">
                <BillableBadge isBillable={project.defaultBillable} />
                <div className="flex items-center gap-1.5 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">${project.defaultRate}/hr</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Right icons */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex flex-col gap-2 max-[399px]:flex-col min-[400px]:flex-row">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange('all')}
                >
                  All Tasks
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange('not_started')}
                >
                  Todo
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange('in_progress')}
                >
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange('complete')}
                >
                  Done
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDrawerOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDrawerOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ProjectDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        projectId={projectId}
      />

      <DeleteProjectDialog
        open={isDeleteDrawerOpen}
        onOpenChange={setIsDeleteDrawerOpen}
        projectId={projectId}
        onDeleteSuccess={onBack}
      />
    </>
  );
}

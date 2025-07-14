import { useTask } from '@/hooks/tasks';
import { formatScheduledDate, formatStatus, getStatusColor } from '@/lib/utils';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Clock, DollarSign, Edit, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BackButton } from '../back-button';
import { BillableBadge } from '../billable-badge';
import { TaskDeleteDialog } from './task-delete-dialog';
import { TaskDrawer } from './task-drawer';

interface TaskInfoProps {
  taskId: string;
  onBack: () => void;
}

export function TaskInfo({ taskId, onBack }: TaskInfoProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);

  const {
    data: task,
    isLoading: isTaskLoading,
    isError: isTaskError,
  } = useTask(taskId || '');

  if (isTaskLoading) {
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
          <div className="flex gap-3 mt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        {/* Right icon */}
        <Skeleton className="h-8 w-8 flex-shrink-0" />
      </div>
    );
  }

  if (!task || isTaskError) {
    return (
      <div className="space-y-4">
        <BackButton onClick={onBack} />
        <div className="py-8 text-center text-muted-foreground">
          <h2 className="text-lg font-medium">The task could not be loaded.</h2>
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
            {task.name}
          </h1>
          <div className="hidden min-[400px]:flex flex-col items-center w-full space-y-2">
            <p className="text-muted-foreground text-sm leading-relaxed w-full max-w-xs text-center break-words">
              {task.notes}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <BillableBadge isBillable={task.isBillable} />
              <Badge className={getStatusColor(task.status) + ' w-fit'}>
                {formatStatus(task.status)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm mt-2">
              {/* Duration */}
              {!!task.expectedDuration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{task.expectedDuration}h</span>
                </div>
              )}
              {/* Rate (if billable) */}
              {task.isBillable && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">${task.rate}/hr</span>
                </div>
              )}
              {/* Schedule */}
              {(task.scheduledStart || task.scheduledEnd) && (
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 flex items-center justify-center">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                  </div>
                  <span className="font-medium">
                    {formatScheduledDate(task.scheduledStart)} -{' '}
                    {formatScheduledDate(task.scheduledEnd)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Right icons */}
        <div className="flex flex-col items-center flex-shrink-0">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDrawerOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteDrawerOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TaskDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        projectId={task.projectId}
        taskId={taskId}
      />

      <TaskDeleteDialog
        open={isDeleteDrawerOpen}
        onOpenChange={setIsDeleteDrawerOpen}
        onDeleteSuccess={onBack}
        taskId={taskId}
      />
    </>
  );
}

import { useTask } from '@/hooks/tasks';
import { formatScheduledDate, formatStatus, getStatusColor } from '@/lib/utils';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Clock, DollarSign, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BillableBadge } from '../billable-badge';
import { TaskDeleteDialog } from './task-delete-dialog';
import { TaskDrawer } from './task-drawer';
import { useNavigate } from 'react-router';

interface TaskInfoProps {
  taskId: string;
}

export function TaskInfo({ taskId }: TaskInfoProps) {
  const navigate = useNavigate();

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);

  const {
    data: task,
    isLoading: isTaskLoading,
    isError: isTaskError,
  } = useTask(taskId || '');

  if (isTaskLoading) {
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!task || isTaskError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <h2 className="text-lg font-medium">
              The task could not be loaded.
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
            <h1 className="text-lg font-bold">{task.name}</h1>
            <div className="flex flex-wrap items-center justify-start min-[400px]:justify-end gap-2">
              <BillableBadge isBillable={task.isBillable} />
              <Badge className={getStatusColor(task.status) + ' w-fit'}>
                {formatStatus(task.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {task.notes}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Duration */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{task.expectedDuration}h</span>
            </div>
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
        </CardContent>
      </Card>

      <TaskDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        projectId={task.projectId}
        taskId={taskId}
      />

      <TaskDeleteDialog
        open={isDeleteDrawerOpen}
        onOpenChange={setIsDeleteDrawerOpen}
        onDeleteSuccess={() => navigate(-1)}
        taskId={taskId}
      />
    </>
  );
}

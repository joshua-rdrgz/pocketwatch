import { useTask } from '@/hooks/tasks';
import { formatScheduledDate, formatStatus, getStatusColor } from '@/lib/utils';
import { Badge } from '@repo/ui/components/badge';
import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Clock, DollarSign } from 'lucide-react';
import { BillableBadge } from '../billable-badge';

interface TaskInfoProps {
  taskId: string;
}

export function TaskInfo({ taskId }: TaskInfoProps) {
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
  );
}

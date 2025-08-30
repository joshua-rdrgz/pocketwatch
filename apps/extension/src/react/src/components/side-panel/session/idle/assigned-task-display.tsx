import { Badge } from '@repo/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { useTask } from '@/hooks/tasks/use-task';
import { Skeleton } from '@repo/ui/components/skeleton';

interface AssignedTaskDisplayProps {
  taskId: string;
}

export function AssignedTaskDisplay({ taskId }: AssignedTaskDisplayProps) {
  const { data: task, isLoading } = useTask(taskId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assigned Task</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assigned Task</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Task not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Assigned Task</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <h4 className="font-medium text-foreground">{task.name}</h4>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{task.status}</Badge>
          {task.expectedDuration && (
            <span className="text-xs text-muted-foreground">
              {Math.round(task.expectedDuration / 60)}min
            </span>
          )}
        </div>
        {task.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

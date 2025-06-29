import { useProjectTasks } from '@/hooks/tasks';
import { formatStatus, getStatusColor } from '@/lib/utils';
import { Badge } from '@repo/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/tabs';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

interface ProjectTaskListProps {
  projectId: string;
}

export function ProjectTaskList({ projectId }: ProjectTaskListProps) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {
    data: tasks,
    isLoading: isTasksLoading,
    isError: isTasksError,
  } = useProjectTasks(projectId || '');

  const filteredTasks =
    statusFilter === 'all'
      ? tasks
      : tasks?.filter((task) => task.status === statusFilter);

  const handleTaskClick = (taskId: string) => {
    navigate(`/projects/${projectId}/tasks/${taskId}`);
  };
  if (isTasksError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <h2 className="text-lg font-medium">Failed to load tasks</h2>
            <p className="mt-2">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isTasksLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-xl">Tasks</CardTitle>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-1">
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredTasks || filteredTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-xl">Tasks (0)</CardTitle>
          </div>
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full sm:w-fit"
          >
            <TabsList className="grid w-full grid-cols-4 sm:w-fit sm:grid-cols-none sm:inline-flex">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="not_started" className="text-xs">
                Todo
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs">
                Active
              </TabsTrigger>
              <TabsTrigger value="complete" className="text-xs">
                Done
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No tasks match the selected filters.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-xl">
            Tasks ({filteredTasks.length})
          </CardTitle>
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full sm:w-fit"
          >
            <TabsList className="grid w-full grid-cols-4 sm:w-fit sm:grid-cols-none sm:inline-flex">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="not_started" className="text-xs">
                Todo
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs">
                Active
              </TabsTrigger>
              <TabsTrigger value="complete" className="text-xs">
                Done
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="cursor-pointer hover:shadow-md transition-shadow p-1"
              onClick={() => handleTaskClick(task.id)}
            >
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm sm:text-base">
                      {task.name}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:ml-4">
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      {task.expectedDuration}h
                    </div>
                    <Badge className={getStatusColor(task.status) + ' text-xs'}>
                      {formatStatus(task.status)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

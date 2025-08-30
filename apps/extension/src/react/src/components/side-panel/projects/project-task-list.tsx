import { useProjectTasks } from '@/hooks/tasks';
import { formatStatus } from '@/lib/utils';
import { StatusFilter } from '@/pages/sp-project-detail-page';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { TaskDeleteDialog } from '../tasks/task-delete-dialog';
import { TaskDrawer } from '../tasks/task-drawer';

interface ProjectTaskListProps {
  projectId: string;
  statusFilter?: StatusFilter;
}

export function ProjectTaskList({
  projectId,
  statusFilter = 'all',
}: ProjectTaskListProps) {
  const [creatingTask, setCreatingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

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
    setEditingTaskId(taskId);
  };

  const handleEditTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setEditingTaskId(taskId);
  };

  const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setDeletingTaskId(taskId);
  };

  const handleCreateTask = () => {
    setCreatingTask(true);
  };

  const getFilteredTitle = () => {
    if (statusFilter === 'all') return 'All Tasks';
    return formatStatus(statusFilter);
  };

  if (isTasksError) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <h2 className="text-lg font-medium">Failed to load tasks</h2>
        <p className="mt-2">Please try again later</p>
      </div>
    );
  }

  if (isTasksLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!filteredTasks || filteredTasks.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{getFilteredTitle()}</h2>
            <Badge variant="secondary" className="text-xs">
              0
            </Badge>
          </div>
          <Button
            variant="ghost"
            onClick={handleCreateTask}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="h-12 flex items-center justify-center text-center text-muted-foreground">
            <span>No tasks match the selected filters.</span>
          </div>
        </div>

        <TaskDrawer
          open={creatingTask}
          onOpenChange={(open) => !open && setCreatingTask(false)}
          projectId={projectId}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{getFilteredTitle()}</h2>
          <Badge variant="secondary" className="text-xs">
            {filteredTasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          onClick={handleCreateTask}
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className="cursor-pointer hover:shadow-md transition-shadow group h-12 min-h-0 flex items-center"
            onClick={() => handleTaskClick(task.id)}
          >
            <CardContent className="p-0 h-full w-full flex items-center">
              <div className="flex items-center gap-3 w-full px-3 h-12">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{task.name}</h3>
                  {statusFilter === 'all' && (
                    <Badge
                      variant="secondary"
                      className="hidden min-[400px]:block text-xs shrink-0"
                    >
                      {formatStatus(
                        task.status as
                          | 'not_started'
                          | 'in_progress'
                          | 'complete'
                      )}
                    </Badge>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleEditTask(e, task.id)}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteTask(e, task.id)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TaskDrawer
        open={creatingTask}
        onOpenChange={(open) => !open && setCreatingTask(false)}
        projectId={projectId}
      />

      <TaskDrawer
        open={!!editingTaskId}
        onOpenChange={(open) => !open && setEditingTaskId(null)}
        projectId={projectId}
        taskId={editingTaskId || undefined}
      />

      <TaskDeleteDialog
        open={!!deletingTaskId}
        onOpenChange={(open) => !open && setDeletingTaskId(null)}
        taskId={deletingTaskId || ''}
      />
    </>
  );
}

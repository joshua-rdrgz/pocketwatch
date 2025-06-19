import { SubtaskEditForm } from '@/components/subtask-edit-form';
import { useSubtasks } from '@/hooks/subtasks/use-subtasks';
import { useUpdateSubtask } from '@/hooks/subtasks/use-update-subtask';
import { useUpdateSubtaskOrder } from '@/hooks/subtasks/use-update-subtask-order';
import { useTask } from '@/hooks/tasks/use-task';
import { formatScheduledDate } from '@/lib/utils';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Subtask } from '@repo/shared/types/db';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import { Skeleton } from '@repo/ui/components/skeleton';
import { ArrowLeft, Clock, DollarSign, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

interface SortableSubtaskProps {
  subtask: Subtask;
  onEdit: (subtask: Subtask) => void;
}

function SortableSubtask({ subtask, onEdit }: SortableSubtaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : 'none',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''} p-1`}
      onClick={() => onEdit(subtask)}
    >
      <CardContent className="p-2 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-100 rounded flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center gap-1.5 min-[380px]:gap-2">
              <h3
                className={`font-medium text-sm sm:text-base break-words ${subtask.isComplete ? 'line-through text-muted-foreground' : ''}`}
              >
                {subtask.name}
              </h3>
              <Badge
                variant={subtask.isComplete ? 'default' : 'secondary'}
                className="w-fit text-xs"
              >
                {subtask.isComplete ? 'Complete' : 'Pending'}
              </Badge>
            </div>
            {subtask.notes && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 break-words">
                {subtask.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'complete':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'not_started':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export function SPTaskDetailPage() {
  const { id: projectId, taskId } = useParams<{ id: string; taskId: string }>();
  const navigate = useNavigate();
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const taskQuery = useTask(taskId || '');
  const subtasksQuery = useSubtasks(taskId || '');
  const updateSubtaskMutation = useUpdateSubtask(editingSubtask?.id || '');
  const updateSubtaskOrderMutation = useUpdateSubtaskOrder(taskId || '');

  const isLoading = taskQuery.isLoading || subtasksQuery.isLoading;
  const isError = taskQuery.isError || subtasksQuery.isError;

  const task =
    taskQuery.data?.status === 'success' ? taskQuery.data.data.task : undefined;
  const subtasks =
    subtasksQuery.data?.status === 'success'
      ? subtasksQuery.data.data.subtasks
      : [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active?.id && over?.id && active.id !== over.id) {
      const oldIndex = subtasks.findIndex(
        (item) => item.id === String(active.id)
      );
      const newIndex = subtasks.findIndex(
        (item) => item.id === String(over.id)
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(subtasks, oldIndex, newIndex);

        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sortOrder: index,
        }));

        updateSubtaskOrderMutation.mutate({
          subtasks: updatedItems.map((item) => ({
            id: item.id,
            sortOrder: item.sortOrder,
          })),
        });
      }
    }
  };

  const handleSubtaskEdit = (subtask: Subtask) => {
    setEditingSubtask(subtask);
    setIsDrawerOpen(true);
  };

  const handleSubtaskSave = (updatedSubtask: Subtask) => {
    updateSubtaskMutation.mutate(
      {
        name: updatedSubtask.name,
        notes: updatedSubtask.notes,
        isComplete: updatedSubtask.isComplete,
        sortOrder: updatedSubtask.sortOrder,
      },
      {
        onSuccess: () => {
          setIsDrawerOpen(false);
          setEditingSubtask(null);
        },
      }
    );
  };

  const handleBack = () => {
    navigate(`/projects/${projectId}`);
  };

  const completedCount = subtasks.filter((s) => s.isComplete).length;

  // Error state
  if (isError) {
    return (
      <div className="p-4 space-y-6">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="text-muted-foreground">Back to Project</span>
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <h2 className="text-lg font-medium">Failed to load task</h2>
              <p className="mt-2">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="text-muted-foreground">Back to Project</span>
        </Button>
      </div>

      {/* Task Information */}
      <Card>
        <CardHeader>
          <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between gap-2 min-[400px]:gap-3">
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <h1 className="text-lg font-bold">{task?.name}</h1>
            )}
            {isLoading ? (
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            ) : task ? (
              <div className="flex flex-wrap items-center justify-start min-[400px]:justify-end gap-2">
                <Badge
                  variant={task.isBillable ? 'default' : 'secondary'}
                  className="w-fit flex items-center gap-1.5"
                >
                  <DollarSign className="h-3 w-3" />
                  {task.isBillable ? 'Billable' : 'Non-billable'}
                </Badge>
                <Badge className={getStatusColor(task.status) + ' w-fit'}>
                  {formatStatus(task.status)}
                </Badge>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : task ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {task.notes}
            </p>
          ) : null}

          {!isLoading && task && (
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
          )}
        </CardContent>
      </Card>

      {/* Subtasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Subtasks (
            {isLoading
              ? '...'
              : `${completedCount}/${subtasks.length} completed`}
            )
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-1">
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-6 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subtasks.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {subtasks.map((subtask) => (
                    <SortableSubtask
                      key={subtask.id}
                      subtask={subtask}
                      onEdit={handleSubtaskEdit}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          {!isLoading && subtasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No subtasks found for this task.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Subtask Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Subtask</DrawerTitle>
          </DrawerHeader>
          {editingSubtask && (
            <SubtaskEditForm
              subtask={editingSubtask}
              onSave={handleSubtaskSave}
              onCancel={() => setIsDrawerOpen(false)}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

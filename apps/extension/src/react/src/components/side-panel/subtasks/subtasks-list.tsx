import { useSubtasks, useUpdateSubtaskOrder } from '@/hooks/subtasks';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Subtask } from '@repo/shared/types/db';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { BackButton } from '../back-button';
import { SortableSubtask } from './sortable-subtask';
import { SubtaskDrawer } from './subtask-drawer';

interface SubtasksListProps {
  taskId: string;
  onBack: () => void;
}

export function SubtasksList({ taskId, onBack }: SubtasksListProps) {
  const {
    data: subtasks,
    isLoading: isSubtasksLoading,
    isError: isSubtasksError,
  } = useSubtasks(taskId || '');
  const { mutate: updateSubtaskOrder } = useUpdateSubtaskOrder(taskId || '');

  const [subtaskEditing, setSubtaskEditing] = useState<Subtask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const completedCount = subtasks?.filter((s) => s.isComplete).length || 0;
  const totalCount = subtasks?.length || 0;

  const handleSubtaskCreate = () => {
    setIsDrawerOpen(true);
  };

  const handleSubtaskEdit = (subtask: Subtask) => {
    setSubtaskEditing(subtask);
    setIsDrawerOpen(true);
  };

  const handleSuccess = () => {
    setIsDrawerOpen(false);
    setSubtaskEditing(null);
  };

  const handleCancel = () => {
    setIsDrawerOpen(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    const subtasksExist = subtasks && subtasks.length > 0;
    const hasDraggingChange = active?.id && over?.id && active.id !== over.id;

    if (subtasksExist && hasDraggingChange) {
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

        updateSubtaskOrder({
          subtasks: updatedItems.map((item) => ({
            id: item.id,
            sortOrder: item.sortOrder,
          })),
        });
      }
    }
  };

  if (isSubtasksError) {
    return (
      <div className="space-y-4">
        <BackButton onClick={onBack} />
        <div className="py-8 text-center text-muted-foreground">
          <h2 className="text-lg font-medium">Failed to load subtasks</h2>
          <p className="mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  if (isSubtasksLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
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

  if (!subtasks || subtasks.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Subtasks</h2>
            <Badge variant="secondary" className="text-xs">
              0/0
            </Badge>
          </div>
          <Button
            variant="ghost"
            onClick={handleSubtaskCreate}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="h-12 flex items-center justify-center text-center text-muted-foreground">
            <span>No subtasks found for this task.</span>
          </div>
        </div>

        <SubtaskDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          subtask={subtaskEditing}
          taskId={!subtaskEditing ? taskId : null}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Subtasks</h2>
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <Button
          variant="ghost"
          onClick={handleSubtaskCreate}
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={subtasks.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {subtasks.map((subtask) => (
              <SortableSubtask
                key={subtask.id}
                subtask={subtask}
                onClick={handleSubtaskEdit}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <SubtaskDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        subtask={subtaskEditing}
        taskId={!subtaskEditing ? taskId : null}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </>
  );
}

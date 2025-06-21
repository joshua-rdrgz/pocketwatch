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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { useState } from 'react';
import { SortableSubtask } from './sortable-subtask';
import { SubtaskDrawer } from './subtask-drawer';
import { Subtask } from '@repo/shared/types/db';

interface SubtasksCardProps {
  taskId: string;
}

export function SubtasksCard({ taskId }: SubtasksCardProps) {
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

  const completedCount = subtasks?.filter((s) => s.isComplete).length;

  const handleSubtaskEdit = (subtask: Subtask) => {
    setSubtaskEditing(subtask);
    setIsDrawerOpen(true);
  };

  const handleSubtaskSaveSuccess = () => {
    setIsDrawerOpen(false);
    setSubtaskEditing(null);
  };

  const handleSubtaskSaveCancel = () => {
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

  if (isSubtasksLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Subtasks (...)</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    );
  }

  if (isSubtasksError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Subtasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Failed to load subtasks. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subtasks || subtasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Subtasks (0/0 completed)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No subtasks found for this task.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Subtasks ({completedCount}/{subtasks.length} completed)
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    onClick={handleSubtaskEdit}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Edit Subtask Drawer */}
      <SubtaskDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        subtask={subtaskEditing}
        onSubtaskSaveSuccess={handleSubtaskSaveSuccess}
        onSubtaskSaveCancel={handleSubtaskSaveCancel}
      />
    </>
  );
}

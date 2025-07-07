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
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SortableSubtask } from './sortable-subtask';
import { SubtaskDrawer } from './subtask-drawer';

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
      <>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Subtasks (0/0 completed)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-center py-8 text-muted-foreground">
              <span>No subtasks found for this task.</span>
              <Button onClick={handleSubtaskCreate} className="mx-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Subtask
              </Button>
            </div>
          </CardContent>
        </Card>

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
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleSubtaskCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Subtask
        </Button>
      </div>
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

      {/* Create/Edit Subtask Drawer */}
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

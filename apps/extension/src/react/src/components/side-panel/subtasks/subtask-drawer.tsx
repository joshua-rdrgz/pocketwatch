import { useCreateSubtask, useUpdateSubtask } from '@/hooks/subtasks';
import { Subtask } from '@repo/shared/types/db';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import { SubtaskForm } from './subtask-form';

interface SubtaskDrawerProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  subtask: Subtask | null;
  taskId: string | null;
  onSuccess(): void;
  onCancel(): void;
}

export function SubtaskDrawer({
  open,
  onOpenChange,
  subtask,
  taskId,
  onSuccess,
  onCancel,
}: SubtaskDrawerProps) {
  const { mutate: updateSubtask } = useUpdateSubtask();
  const { mutate: createSubtask } = useCreateSubtask();

  const isCreationMode = taskId !== null;

  const handleSubtaskSubmit = (subtask: Subtask) => {
    if (isCreationMode) {
      createSubtask(
        {
          taskId,
          data: subtask,
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );

      return;
    }

    updateSubtask(
      {
        taskId: subtask?.taskId || '',
        subtaskId: subtask?.id || '',
        data: {
          name: subtask.name,
          notes: subtask.notes,
          isComplete: subtask.isComplete,
        },
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Subtask</DrawerTitle>
          <DrawerDescription>
            Make changes to your subtask. Click save when you&apos;re done.
          </DrawerDescription>
        </DrawerHeader>

        <SubtaskForm
          subtask={subtask}
          onSubmit={handleSubtaskSubmit}
          onCancel={onCancel}
        />
      </DrawerContent>
    </Drawer>
  );
}

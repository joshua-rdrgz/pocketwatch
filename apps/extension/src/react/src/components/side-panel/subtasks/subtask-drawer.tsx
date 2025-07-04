import { Subtask } from '@repo/shared/types/db';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import { SubtaskEditForm } from './subtask-edit-form';
import { useUpdateSubtask } from '@/hooks/subtasks';

interface SubtaskDrawerProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  subtask: Subtask | null;
  onSubtaskSaveSuccess(): void;
  onSubtaskSaveCancel(): void;
}

export function SubtaskDrawer({
  open,
  onOpenChange,
  subtask,
  onSubtaskSaveSuccess,
  onSubtaskSaveCancel,
}: SubtaskDrawerProps) {
  const { mutate: updateSubtask } = useUpdateSubtask();

  const handleSubtaskSave = (updatedSubtask: Subtask) => {
    updateSubtask(
      {
        taskId: subtask?.taskId || '',
        subtaskId: subtask?.id || '',
        data: {
          name: updatedSubtask.name,
          notes: updatedSubtask.notes,
          isComplete: updatedSubtask.isComplete,
        },
      },
      {
        onSuccess: () => {
          onSubtaskSaveSuccess();
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
        {subtask && (
          <SubtaskEditForm
            subtask={subtask}
            onSave={handleSubtaskSave}
            onCancel={onSubtaskSaveCancel}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

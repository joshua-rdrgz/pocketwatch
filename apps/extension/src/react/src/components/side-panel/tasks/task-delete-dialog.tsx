import { useDeleteTask, useTask } from '@/hooks/tasks';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/alert-dialog';

interface TaskDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess?(): void;
  taskId: string;
}

export function TaskDeleteDialog({
  open,
  onOpenChange,
  onDeleteSuccess,
  taskId,
}: TaskDeleteDialogProps) {
  const { data: task } = useTask(taskId);
  const { mutateAsync: deleteTask, isPending: isDeleting } = useDeleteTask();

  const handleDelete = async () => {
    try {
      await deleteTask(
        { taskId, projectIdToInvalidate: task?.projectId || '' },
        {
          onSuccess: () => {
            onOpenChange(false);
            onDeleteSuccess?.();
          },
        }
      );
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{task?.name}"? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

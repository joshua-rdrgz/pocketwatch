import { Subtask } from '@repo/shared/types/db';
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

interface DeleteSubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtask: Subtask | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteSubtaskDialog({
  open,
  onOpenChange,
  subtask,
  onConfirm,
  onCancel,
}: DeleteSubtaskDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Subtask</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{subtask?.name}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

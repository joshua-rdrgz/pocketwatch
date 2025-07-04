import { useDeleteProject } from '@/hooks/projects/use-delete-project';
import { useProject } from '@/hooks/projects/use-project';
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

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onDeleteSuccess?(): void;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectId,
  onDeleteSuccess,
}: DeleteProjectDialogProps) {
  const { data: project } = useProject(projectId);
  const { mutateAsync: deleteProject, isPending: isDeleting } =
    useDeleteProject();

  const handleDelete = async () => {
    try {
      await deleteProject(projectId, {
        onSuccess: () => {
          onOpenChange(false);
          onDeleteSuccess?.();
        },
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{project?.name}"? This action
            cannot be undone.
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

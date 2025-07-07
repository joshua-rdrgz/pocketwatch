import { useTask } from '@/hooks/tasks';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import { TaskForm } from './task-form';

interface TaskDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskId?: string;
}

export function TaskDrawer({
  open,
  onOpenChange,
  projectId,
  taskId,
}: TaskDrawerProps) {
  const { data: task } = useTask(taskId || '');
  const isEditing = !!taskId;

  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh] flex flex-col" data-vaul-drawer>
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Task' : 'Create Task'}
          </DrawerTitle>
          <DrawerDescription>
            {isEditing
              ? 'Update your task details and settings.'
              : 'Create a new task for this project.'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <TaskForm
            task={task}
            projectId={projectId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

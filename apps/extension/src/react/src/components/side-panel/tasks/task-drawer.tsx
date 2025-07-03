// import { useTask } from '@/hooks/tasks';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/components/drawer';
// import { TaskForm } from './task-form';
import { DateTimePickerForm } from './date-time-picker-form-demo';

interface TaskDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskId?: string;
}

export function TaskDrawer({
  open,
  onOpenChange,
  // projectId,
  // taskId,
}: TaskDrawerProps) {
  // const { data: task } = useTask(taskId || '');

  // const handleSuccess = () => {
  //   onOpenChange(false);
  // };

  // const handleCancel = () => {
  //   onOpenChange(false);
  // };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent className="max-h-[80vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle className="text-xl font-semibold">Edit Task</DrawerTitle>
          <DrawerDescription>
            Update your task details and settings.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* <TaskForm
            task={task}
            projectId={projectId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          /> */}
          <DateTimePickerForm />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

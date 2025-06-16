import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import { ProjectForm } from './project-form';
import { ProjectResponse } from '@repo/shared/types/project';

interface ProjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectResponse['project'] | null;
}

export function ProjectDrawer({
  open,
  onOpenChange,
  project,
}: ProjectDrawerProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="space-y-4">
          <DrawerHeader>
            <DrawerTitle className="text-xl font-semibold">
              {project ? 'Edit Project' : 'Create Project'}
            </DrawerTitle>
            <DrawerDescription>
              {project
                ? 'Update your project settings and details.'
                : 'Create a new project to organize your tasks.'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <ProjectForm
              project={project}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

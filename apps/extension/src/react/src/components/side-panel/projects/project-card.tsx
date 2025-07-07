import { ProjectSummary } from '@repo/shared/types/project';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { DollarSign, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ProjectDrawer } from './project-drawer';
import { useState } from 'react';
import { DeleteProjectDialog } from './delete-project-dialog';

interface ProjectCardProps {
  project: ProjectSummary;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleCardClick = () => {
    navigate(`/projects/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditDrawerOpen(true);
  };

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-accent/50 transition-colors p-1"
        onClick={handleCardClick}
      >
        <CardContent className="flex items-center justify-between p-0 py-2 px-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 flex items-center justify-center">
              {project.defaultBillable && (
                <DollarSign className="h-3 w-3 text-green-600" />
              )}
            </div>
            <span className="font-medium text-sm">{project.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleEdit}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProjectDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        projectId={project.id}
      />

      <DeleteProjectDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        projectId={project.id}
      />
    </>
  );
}

import { useDeleteSubtask } from '@/hooks/subtasks';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Subtask } from '@repo/shared/types/db';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { GripVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DeleteSubtaskDialog } from './delete-subtask-dialog';

interface SortableSubtaskProps {
  subtask: Subtask;
  onClick: (subtask: Subtask) => void;
}

export function SortableSubtask({ subtask, onClick }: SortableSubtaskProps) {
  const { mutate: deleteSubtask } = useDeleteSubtask();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : 'none',
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDeleteDialogOpen = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation(); // Handle this click event, not the click event behind it
    setIsDrawerOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteSubtask({ taskId: subtask.taskId, subtaskId: subtask.id });
    setIsDrawerOpen(false);
  };

  const handleDeleteCancel = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''} p-1`}
        onClick={() => onClick(subtask)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-100 rounded flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center gap-1.5 min-[380px]:gap-2">
                <h3
                  className={`font-medium text-sm sm:text-base break-words ${subtask.isComplete ? 'line-through text-muted-foreground' : ''}`}
                >
                  {subtask.name}
                </h3>
                <Badge
                  variant={subtask.isComplete ? 'default' : 'secondary'}
                  className="w-fit text-xs"
                >
                  {subtask.isComplete ? 'Complete' : 'Pending'}
                </Badge>
              </div>
              {subtask.notes && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 break-words">
                  {subtask.notes}
                </p>
              )}
            </div>
            {isHovered && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleDeleteDialogOpen}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <DeleteSubtaskDialog
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        subtask={subtask}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Subtask } from '@repo/shared/types/db';
import { Badge } from '@repo/ui/components/badge';
import { Card, CardContent } from '@repo/ui/components/card';
import { GripVertical } from 'lucide-react';

interface SortableSubtaskProps {
  subtask: Subtask;
  onClick: (subtask: Subtask) => void;
}

export function SortableSubtask({ subtask, onClick }: SortableSubtaskProps) {
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''} p-1`}
      onClick={() => onClick(subtask)}
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
        </div>
      </CardContent>
    </Card>
  );
}

import { SubtaskEditForm } from '@/components/subtask-edit-form';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Subtask, Task } from '@repo/shared/types/db';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import { ArrowLeft, Clock, DollarSign, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

// Mock data
const MOCK_TASK: Task = {
  id: 'task1',
  userId: 'user1',
  projectId: '1',
  name: 'Frontend Component Library',
  notes:
    'Build reusable React components for the new design system including buttons, forms, modals, and data tables.',
  isBillable: true,
  rate: '125.00',
  expectedDuration: '32.00',
  scheduledStart: new Date('2024-02-05'),
  scheduledEnd: new Date('2024-02-09'),
  status: 'in_progress',
  createdAt: new Date('2024-01-16'),
  updatedAt: new Date('2024-01-21'),
};

const MOCK_SUBTASKS: Subtask[] = [
  {
    id: 'subtask1',
    userId: 'user1',
    taskId: 'task1',
    sortOrder: 0,
    name: 'Design button component variants',
    notes:
      'Create primary, secondary, outline, and ghost button variants with proper hover states',
    isComplete: true,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'subtask2',
    userId: 'user1',
    taskId: 'task1',
    sortOrder: 1,
    name: 'Implement form components',
    notes:
      'Input, textarea, select, checkbox, and radio components with validation states',
    isComplete: true,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'subtask3',
    userId: 'user1',
    taskId: 'task1',
    sortOrder: 2,
    name: 'Build modal and dialog components',
    notes:
      'Accessible modal with backdrop, close button, and keyboard navigation',
    isComplete: false,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'subtask4',
    userId: 'user1',
    taskId: 'task1',
    sortOrder: 3,
    name: 'Create data table component',
    notes: 'Sortable, filterable table with pagination and row selection',
    isComplete: false,
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'subtask5',
    userId: 'user1',
    taskId: 'task1',
    sortOrder: 4,
    name: 'Write component documentation',
    notes: 'Storybook stories and usage examples for all components',
    isComplete: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

interface SortableSubtaskProps {
  subtask: Subtask;
  onEdit: (subtask: Subtask) => void;
}

function SortableSubtask({ subtask, onEdit }: SortableSubtaskProps) {
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
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''} p-1`}
      onClick={() => onEdit(subtask)}
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'complete':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'not_started':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export function SPTaskDetailPage() {
  const { id: projectId } = useParams<{ id: string; taskId: string }>();
  const navigate = useNavigate();
  const [subtasks, setSubtasks] = useState(MOCK_SUBTASKS);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSubtasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update sort orders
        return newItems.map((item, index) => ({
          ...item,
          sortOrder: index,
        }));
      });
    }
  };

  const handleSubtaskEdit = (subtask: Subtask) => {
    setEditingSubtask(subtask);
    setIsDrawerOpen(true);
  };

  const handleSubtaskSave = (updatedSubtask: Subtask) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === updatedSubtask.id ? updatedSubtask : s))
    );
    setIsDrawerOpen(false);
    setEditingSubtask(null);
  };

  const handleBack = () => {
    navigate(`/projects/${projectId}`);
  };

  const completedCount = subtasks.filter((s) => s.isComplete).length;

  return (
    <div className="p-4 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="text-muted-foreground">Back to Project</span>
        </Button>
      </div>

      {/* Task Information */}
      <Card>
        <CardHeader>
          <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between gap-2 min-[400px]:gap-3">
            <h1 className="text-lg font-bold">{MOCK_TASK.name}</h1>
            <div className="flex flex-wrap items-center justify-start min-[400px]:justify-end gap-2">
              <Badge
                variant={MOCK_TASK.isBillable ? 'default' : 'secondary'}
                className="w-fit flex items-center gap-1.5"
              >
                <DollarSign className="h-3 w-3" />
                {MOCK_TASK.isBillable ? 'Billable' : 'Non-billable'}
              </Badge>
              <Badge className={getStatusColor(MOCK_TASK.status) + ' w-fit'}>
                {formatStatus(MOCK_TASK.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {MOCK_TASK.notes}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Duration */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{MOCK_TASK.expectedDuration}h</span>
            </div>

            {/* Rate (if billable) */}
            {MOCK_TASK.isBillable && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">${MOCK_TASK.rate}/hr</span>
              </div>
            )}

            {/* Schedule */}
            {(MOCK_TASK.scheduledStart || MOCK_TASK.scheduledEnd) && (
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 flex items-center justify-center">
                  <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                </div>
                <span className="font-medium">
                  {MOCK_TASK.scheduledStart?.toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: '2-digit',
                  }) || '?'}{' '}
                  -{' '}
                  {MOCK_TASK.scheduledEnd?.toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: '2-digit',
                  }) || '?'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subtasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Subtasks ({completedCount}/{subtasks.length} completed)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={subtasks.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {subtasks.map((subtask) => (
                  <SortableSubtask
                    key={subtask.id}
                    subtask={subtask}
                    onEdit={handleSubtaskEdit}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {subtasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No subtasks found for this task.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Subtask Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Subtask</DrawerTitle>
          </DrawerHeader>
          {editingSubtask && (
            <SubtaskEditForm
              subtask={editingSubtask}
              onSave={handleSubtaskSave}
              onCancel={() => setIsDrawerOpen(false)}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

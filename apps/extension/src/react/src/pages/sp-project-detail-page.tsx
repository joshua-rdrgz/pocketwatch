import type { Project } from '@repo/shared/types/db';
import { TaskSummary } from '@repo/shared/types/task';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/tabs';
import { ArrowLeft, Clock, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

// Mock data based on your schema
const MOCK_PROJECT: Project = {
  id: '1',
  userId: 'user1',
  name: 'E-commerce Platform Redesign',
  description:
    'Complete overhaul of the existing e-commerce platform with modern UI/UX and improved performance.',
  defaultBillable: true,
  defaultRate: '125.00',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20'),
};

const MOCK_TASKS: TaskSummary[] = [
  {
    id: 'task1',
    name: 'User Research & Analysis',
    expectedDuration: '16.00',
    status: 'complete',
  },
  {
    id: 'task2',
    name: 'Frontend Component Library',
    expectedDuration: '32.00',
    status: 'in_progress',
  },
  {
    id: 'task3',
    name: 'API Integration',
    expectedDuration: '24.00',
    status: 'not_started',
  },
  {
    id: 'task4',
    name: 'Performance Optimization',
    expectedDuration: '12.00',
    status: 'not_started',
  },
];

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

export function SPProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTasks =
    statusFilter === 'all'
      ? MOCK_TASKS
      : MOCK_TASKS.filter((task) => task.status === statusFilter);

  const handleTaskClick = (taskId: string) => {
    navigate(`/projects/${id}/tasks/${taskId}`);
  };

  const handleBack = () => {
    navigate('/projects');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="text-muted-foreground">Back to Projects</span>
        </Button>
      </div>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between gap-2 min-[400px]:gap-3">
            <h1 className="text-lg font-bold">{MOCK_PROJECT.name}</h1>
            <div className="flex flex-wrap items-center justify-start min-[400px]:justify-end gap-2">
              <Badge
                variant={MOCK_PROJECT.defaultBillable ? 'default' : 'secondary'}
                className="w-fit flex items-center gap-1.5"
              >
                <DollarSign className="h-3 w-3" />
                {MOCK_PROJECT.defaultBillable ? 'Billable' : 'Non-billable'}
              </Badge>
              {MOCK_PROJECT.defaultBillable && (
                <div className="flex items-center gap-1.5 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    ${MOCK_PROJECT.defaultRate}/hr
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {MOCK_PROJECT.description}
          </p>
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-xl">
              Tasks ({filteredTasks.length})
            </CardTitle>
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full sm:w-fit"
            >
              <TabsList className="grid w-full grid-cols-4 sm:w-fit sm:grid-cols-none sm:inline-flex">
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="not_started" className="text-xs">
                  Todo
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="text-xs">
                  Active
                </TabsTrigger>
                <TabsTrigger value="complete" className="text-xs">
                  Done
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <Card
                key={task.id}
                className="cursor-pointer hover:shadow-md transition-shadow p-1"
                onClick={() => handleTaskClick(task.id)}
              >
                <CardContent className="p-2 sm:p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm sm:text-base">
                        {task.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:ml-4">
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        {task.expectedDuration}h
                      </div>
                      <Badge
                        className={getStatusColor(task.status) + ' text-xs'}
                      >
                        {formatStatus(task.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No tasks match the selected filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

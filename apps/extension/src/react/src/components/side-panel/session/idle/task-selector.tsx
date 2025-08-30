import { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { useProjects } from '@/hooks/projects/use-projects';
import { useProjectTasks } from '@/hooks/tasks/use-project-tasks';
import { useSessionStore } from '@/stores/session-store';

export function TaskSelector() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const { assignTask } = useSessionStore();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tasks, isLoading: tasksLoading } =
    useProjectTasks(selectedProjectId);

  const handleAssignTask = () => {
    if (selectedTaskId) {
      assignTask(selectedTaskId);
    }
  };

  const isAssignDisabled = !selectedTaskId || tasksLoading;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2">
          Select Project
        </h3>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a project" />
          </SelectTrigger>
          <SelectContent>
            {projectsLoading ? (
              <SelectItem value="loading" disabled>
                Loading projects...
              </SelectItem>
            ) : projects?.length ? (
              projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-projects" disabled>
                No projects found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedProjectId && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">
            Select Task
          </h3>
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a task" />
            </SelectTrigger>
            <SelectContent>
              {tasksLoading ? (
                <SelectItem value="loading" disabled>
                  Loading tasks...
                </SelectItem>
              ) : tasks?.length ? (
                tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-tasks" disabled>
                  No tasks found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedTaskId && (
        <Button
          onClick={handleAssignTask}
          disabled={isAssignDisabled}
          className="w-full"
        >
          Assign Task
        </Button>
      )}
    </div>
  );
}

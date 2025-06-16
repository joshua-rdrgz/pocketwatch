import { NewTask, Task } from './db';

// Task summary type for list views (only essential fields)
export type TaskSummary = Pick<
  Task,
  'id' | 'name' | 'expectedDuration' | 'status'
>;

// Task request type (omit auto-generated fields)
export type TaskRequest = Omit<
  NewTask,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

// Response types (include all fields)
export interface TaskResponse {
  task: Task;
}

export interface TasksListResponse {
  tasks: TaskSummary[];
}

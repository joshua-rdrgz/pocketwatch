import { NewTask, Task } from './db';

// Task summary type when querying tasks by day
export type TaskDaySummary = Pick<
  Task,
  'id' | 'projectId' | 'name' | 'expectedDuration' | 'status'
>;

// Task summary type when querying tasks by project ID (projectId in type redundant)
export type TaskProjectSummary = Pick<
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

export interface TasksByDayListResponse {
  tasks: TaskDaySummary[];
}

export interface TasksByProjectListResponse {
  tasks: TaskProjectSummary[];
}

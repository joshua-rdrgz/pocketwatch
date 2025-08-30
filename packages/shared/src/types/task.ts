import { NewTask, Task } from './db';

// ##########################################
// TASK TYPES
// ##########################################

export type TaskDaySummary = Pick<Task, 'id' | 'projectId' | 'name' | 'status'>;

export type TaskProjectSummary = Pick<Task, 'id' | 'name' | 'status'>;

export type TaskRequest = Omit<
  NewTask,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export interface TaskResponse {
  task: Task;
}

export interface TasksByDayListResponse {
  tasks: TaskDaySummary[];
}

export interface TasksByProjectListResponse {
  tasks: TaskProjectSummary[];
}

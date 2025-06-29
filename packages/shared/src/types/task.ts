import { NewTask, Task } from './db';

// ##########################################
// TASK TYPES
// ##########################################

export type TaskDaySummary = Pick<Task, 'id' | 'projectId' | 'name' | 'status'>;

export type TaskProjectSummary = Pick<Task, 'id' | 'name' | 'status'> & {
  expectedDuration?: number;
};

export type TaskRequest = Omit<
  NewTask,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export interface TaskResponse {
  task: Task & {
    expectedDuration?: number;
  };
}

export interface TasksByDayListResponse {
  tasks: TaskDaySummary[];
}

export interface TasksByProjectListResponse {
  tasks: TaskProjectSummary[];
}

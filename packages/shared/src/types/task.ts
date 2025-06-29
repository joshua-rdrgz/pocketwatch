import { NewTask, Task, NewSubtask, Subtask } from './db';

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

// ##########################################
// SUBTASK TYPES
// ##########################################

export interface SubtaskOrderEntry {
  id: string;
  sortOrder: number;
}

export type SubtaskCreateRequest = Omit<
  NewSubtask,
  'id' | 'userId' | 'taskId' | 'createdAt' | 'updatedAt'
>;

export type SubtaskUpdateRequest = Omit<
  NewSubtask,
  'id' | 'userId' | 'taskId' | 'createdAt' | 'updatedAt'
>;

export interface SubtasksOrderRequest {
  subtasks: SubtaskOrderEntry[];
}

export interface SubtaskResponse {
  subtask: Subtask;
}

export interface SubtasksListResponse {
  subtasks: Subtask[];
}

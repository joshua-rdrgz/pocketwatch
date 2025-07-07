import { NewSubtask, Subtask } from './db';

export interface SubtaskOrderEntry {
  id: string;
  sortOrder: number;
}

export type SubtaskRequest = Omit<
  NewSubtask,
  'id' | 'userId' | 'taskId' | 'createdAt' | 'updatedAt' | 'sortOrder'
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

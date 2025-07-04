import { NewSubtask, Subtask } from './db';

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

import { NewSubtask, Subtask } from './db';

// Subtask order entry for reordering
export interface SubtaskOrderEntry {
  id: string;
  sortOrder: number;
}

// Subtask request types (omit auto-generated fields)
export type SubtaskCreateRequest = Omit<
  NewSubtask,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type SubtaskUpdateRequest = Omit<
  NewSubtask,
  'id' | 'userId' | 'taskId' | 'createdAt' | 'updatedAt'
>;

// Subtask order request for batch operations
export interface SubtasksOrderRequest {
  subtasks: SubtaskOrderEntry[];
}

// Response types
export interface SubtaskResponse {
  subtask: Subtask;
}

export interface SubtasksListResponse {
  subtasks: Subtask[];
}

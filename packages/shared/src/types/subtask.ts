import { NewSubtask, Subtask } from './db';

// Subtask order entry for reordering
export interface SubtaskOrderEntry {
  id: string;
  sortOrder: number;
}

// Subtask request type (omit auto-generated fields)
export type SubtaskRequest = Omit<
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

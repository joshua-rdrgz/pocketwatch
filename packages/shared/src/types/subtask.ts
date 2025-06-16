import { NewSubtask, Subtask } from './db';

// Subtask summary type for list views
export type SubtaskSummary = Pick<
  Subtask,
  'id' | 'name' | 'isComplete' | 'sortOrder'
>;

// Subtask request type (omit auto-generated fields)
export type SubtaskRequest = Omit<
  NewSubtask,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

// Response types (include all fields)
export interface SubtaskResponse {
  subtask: Subtask;
}

export interface SubtasksListResponse {
  subtasks: Subtask[];
}

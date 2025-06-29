import { Task, Subtask } from './db';

export interface TaskScheduleItem
  extends Pick<
    Task,
    | 'id'
    | 'name'
    | 'notes'
    | 'scheduledStart'
    | 'scheduledEnd'
    | 'projectId'
    | 'isBillable'
  > {
  type: 'task';
}

export interface SubtaskScheduleItem
  extends Pick<
    Subtask,
    'id' | 'name' | 'notes' | 'scheduledStart' | 'scheduledEnd' | 'taskId'
  > {
  type: 'subtask';
  projectId: string; // grandparent - not directly on Subtask, so we add it
  isBillable: boolean; // inherited from parent task - not on Subtask, so we add it
}

export type ScheduleItem = TaskScheduleItem | SubtaskScheduleItem;

export interface ScheduleResponse {
  events: ScheduleItem[];
}

// Query parameter types for the schedule endpoint
export interface ScheduleQueryParams {
  start?: string; // ISO date string
  end?: string; // ISO date string
}

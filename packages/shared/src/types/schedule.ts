import { Task } from './db';

export type ScheduleItem = Pick<
  Task,
  | 'id'
  | 'name'
  | 'notes'
  | 'scheduledStart'
  | 'scheduledEnd'
  | 'projectId'
  | 'isBillable'
>;

export interface ScheduleResponse {
  events: ScheduleItem[];
}

// Query parameter types for the schedule endpoint
export interface ScheduleQueryParams {
  start?: string; // ISO date string
  end?: string; // ISO date string
}

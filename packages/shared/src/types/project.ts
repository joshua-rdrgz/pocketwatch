import { NewProject, Project } from './db';

export type ProjectSummary = Pick<Project, 'id' | 'name' | 'defaultBillable'>;

export type ProjectRequest = Omit<
  NewProject,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

// Response types (include all fields)
export interface ProjectResponse {
  project: Project;
}

export interface ProjectsListResponse {
  projects: ProjectSummary[];
}

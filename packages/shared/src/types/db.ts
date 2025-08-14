import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { user, session, account, verification } from '../db/auth-schema';
import { project, task, taskStatusEnum } from '../db/schema';

// Auth types
export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;

export type Session = InferSelectModel<typeof session>;
export type NewSession = InferInsertModel<typeof session>;

export type Account = InferSelectModel<typeof account>;
export type NewAccount = InferInsertModel<typeof account>;

export type Verification = InferSelectModel<typeof verification>;
export type NewVerification = InferInsertModel<typeof verification>;

// App types
export type Project = InferSelectModel<typeof project>;
export type NewProject = InferInsertModel<typeof project>;

export type Task = InferSelectModel<typeof task>;
export type NewTask = InferInsertModel<typeof task>;

// Enum types
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];

// Extended types with relations
export type ProjectWithTasks = Project & {
  tasks: Task[];
};

export type TaskWithProject = Task & {
  project: Project;
};

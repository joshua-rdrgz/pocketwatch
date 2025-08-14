import { relations } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

// Enums
export const taskStatusEnum = pgEnum('task_status', [
  'not_started',
  'in_progress',
  'complete',
]);

export const workSessionStatusEnum = pgEnum('work_session_status', [
  'active',
  'completed',
  'cancelled',
]);

// Project table
export const project = pgTable('project', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  defaultBillable: boolean('default_billable').notNull().default(false),
  defaultRate: numeric('default_rate', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Task table
export const task = pgTable('task', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => project.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  notes: text('notes'),
  isBillable: boolean('is_billable').notNull().default(false),
  rate: numeric('rate', { precision: 10, scale: 2 }).notNull().default('0'),
  scheduledStart: timestamp('scheduled_start'),
  scheduledEnd: timestamp('scheduled_end'),
  status: taskStatusEnum('status').notNull().default('not_started'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Work Session table - stores work sessions (renamed from 'session' to avoid conflict)
// 1-1 relationship with task via unique taskId constraint
export const workSession = pgTable('work_session', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id')
    .notNull()
    .unique() // This enforces 1-1 relationship
    .references(() => task.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  status: workSessionStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Work Session Event table - stores all events that occurred during a session
export const workSessionEvent = pgTable('work_session_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => workSession.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'stopwatch', 'browser'
  action: text('action').notNull(), // 'start', 'break', 'resume', 'finish', etc.
  timestamp: timestamp('timestamp').notNull(),
  payload: jsonb('payload'), // Optional payload data
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Relations
export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  tasks: many(task),
}));

export const taskRelations = relations(task, ({ one }) => ({
  user: one(user, {
    fields: [task.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [task.projectId],
    references: [project.id],
  }),
  workSession: one(workSession), // 1-1 relationship
}));

export const workSessionRelations = relations(workSession, ({ one, many }) => ({
  user: one(user, {
    fields: [workSession.userId],
    references: [user.id],
  }),
  task: one(task, {
    fields: [workSession.taskId],
    references: [task.id],
  }),
  events: many(workSessionEvent),
}));

export const workSessionEventRelations = relations(
  workSessionEvent,
  ({ one }) => ({
    session: one(workSession, {
      fields: [workSessionEvent.sessionId],
      references: [workSession.id],
    }),
  })
);

import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth-schema';

// Enums
export const taskStatusEnum = pgEnum('task_status', [
  'not_started',
  'in_progress',
  'complete',
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
  expectedDuration: numeric('expected_duration', { precision: 10, scale: 2 })
    .notNull()
    .default('0'), // in hours
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

// Subtask table
export const subtask = pgTable('subtask', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id')
    .notNull()
    .references(() => task.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  name: text('name').notNull(),
  notes: text('notes'),
  isComplete: boolean('is_complete').notNull().default(false),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
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

export const taskRelations = relations(task, ({ one, many }) => ({
  user: one(user, {
    fields: [task.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [task.projectId],
    references: [project.id],
  }),
  subtasks: many(subtask),
}));

export const subtaskRelations = relations(subtask, ({ one }) => ({
  user: one(user, {
    fields: [subtask.userId],
    references: [user.id],
  }),
  task: one(task, {
    fields: [subtask.taskId],
    references: [task.id],
  }),
}));

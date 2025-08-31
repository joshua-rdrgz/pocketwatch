import { relations } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

// Work Session table - stores work sessions (renamed from 'session' to avoid conflict)
export const workSession = pgTable('work_session', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
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
export const workSessionRelations = relations(workSession, ({ one, many }) => ({
  user: one(user, {
    fields: [workSession.userId],
    references: [user.id],
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

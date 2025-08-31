import { relations } from 'drizzle-orm';
import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const dash = pgTable('dash', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const dashRelations = relations(dash, ({ one, many }) => ({
  user: one(user, {
    fields: [dash.userId],
    references: [user.id],
  }),
  events: many(dashEvent),
}));

export const dashEventActionEnum = pgEnum('dash_event_action_enum', [
  'start',
  'break',
  'resume',
  'finish',
]);

export const dashEvent = pgTable('dash_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashId: uuid('dash_id')
    .notNull()
    .references(() => dash.id, { onDelete: 'cascade' }),
  action: dashEventActionEnum('action').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  payload: jsonb('payload'), // Optional payload data
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const dashEventRelations = relations(dashEvent, ({ one }) => ({
  dash: one(dash, {
    fields: [dashEvent.dashId],
    references: [dash.id],
  }),
}));

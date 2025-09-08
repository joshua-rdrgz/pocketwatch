import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
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

  name: text('name'),
  category: text('category'),
  notes: text('notes'),
  isMonetized: boolean('is_monetized').notNull().default(false),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 })
    .notNull()
    .default('0.00'),

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

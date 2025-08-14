/* eslint-disable @typescript-eslint/no-explicit-any */
import { drizzle } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@repo/shared/db/schema';
import * as authSchema from '@repo/shared/db/auth-schema';

export async function createTestDb() {
  // Create in-memory PGlite instance
  const client = new PGlite();

  // Create Drizzle instance with all schemas
  const db = drizzle(client, {
    schema: { ...schema, ...authSchema },
  });

  await migrate(db, { migrationsFolder: './drizzle' });

  return { db, client };
}

export async function resetTestDb(db: any) {
  // Clean all tables in the correct order (respecting foreign keys)
  const tables = [
    'task',
    'project',
    'verification',
    'account',
    'session',
    'user',
  ];

  for (const table of tables) {
    await db.execute(`DELETE FROM "${table}"`);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@repo/shared/db/schema';
import * as authSchema from '@repo/shared/db/auth-schema';

// Production database
const productionDb = drizzle(process.env.MY_API_DATABASE_URL!, {
  schema: { ...schema, ...authSchema },
});

export type DB = typeof productionDb;

// Export function to get the right database instance
export function getDb(): DB {
  // Use test database if available (set by test setup)
  if ((globalThis as any).testDb) {
    return (globalThis as any).testDb;
  }
  return productionDb;
}

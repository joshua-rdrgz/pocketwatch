/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestDb, resetTestDb } from './test-db';

let testDb: any;
let testClient: any;

beforeAll(async () => {
  // Create test database
  const { db, client } = await createTestDb();
  testDb = db;
  testClient = client;

  // Make it globally available
  (globalThis as any).testDb = testDb;
});

afterAll(async () => {
  // Clean up
  if (testClient) {
    await testClient.close();
  }
});

beforeEach(async () => {
  // Reset database between tests
  if (testDb) {
    await resetTestDb(testDb);
  }
});

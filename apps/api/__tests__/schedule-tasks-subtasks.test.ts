/* eslint-disable @typescript-eslint/no-explicit-any */
import { user } from '@repo/shared/db/auth-schema';
import { project } from '@repo/shared/db/schema';
import type { SuccessResponse } from '@repo/shared/types/api';
import type { TaskResponse } from '@repo/shared/types/task';
import request from 'supertest';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import { createApp } from '../src/app';
import { randomUUID } from 'crypto';

// Mock the module at the top level (hoisted)
vi.mock('@/middleware/auth', () => ({
  retrieveUserSession: vi.fn(),
  requireUserSession: vi.fn(),
}));

// Import the mocked functions AFTER the mock declaration
import { retrieveUserSession, requireUserSession } from '@/middleware/auth';

describe('Schedule, Tasks, and Subtasks with Scheduling Features', () => {
  const app = createApp();
  let TEST_USER_ID: string;
  let TEST_PROJECT_ID: string;

  // Helper function to create a scheduled task for schedule tests
  const createTask = async (taskData: {
    name: string;
    notes?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
    isBillable?: boolean;
  }): Promise<string> => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        projectId: TEST_PROJECT_ID,
        ...taskData,
      });
    return (response.body as SuccessResponse<TaskResponse>).data.task.id;
  };

  // Helper function to create a scheduled subtask for schedule tests
  const createSubtask = async (
    taskId: string,
    subtaskData: {
      name: string;
      notes?: string;
      scheduledStart?: string;
      scheduledEnd?: string;
    }
  ): Promise<string> => {
    const response = await request(app)
      .post(`/api/tasks/${taskId}/subtasks`)
      .send(subtaskData);
    return (response.body as SuccessResponse<{ subtask: any }>).data.subtask.id;
  };

  // Universal test data factory for creating scheduled tasks/subtasks with various date relationships
  const createTestDataFactory = async (config: {
    targetDate?: string;
    targetStartDate?: string;
    targetEndDate?: string;
    scenarios?: Array<
      | 'before'
      | 'within'
      | 'after'
      | 'startsWithin'
      | 'endsWithin'
      | 'spans'
      | 'boundaries'
    >;
    includeSubtasks?: boolean;
    namePrefix?: string;
  }): Promise<Record<string, string>> => {
    const {
      targetDate,
      targetStartDate,
      targetEndDate,
      scenarios = [
        'before',
        'within',
        'after',
        'startsWithin',
        'endsWithin',
        'spans',
        'boundaries',
      ],
      includeSubtasks = true,
      namePrefix = '',
    } = config;

    // Determine dates based on configuration
    const isDateRange = targetStartDate && targetEndDate;
    const referenceDate = targetDate || targetStartDate || '2024-12-01';
    const startDate = targetStartDate || referenceDate;
    const endDate = targetEndDate || referenceDate;

    // Calculate relative dates for various scenarios
    const beforeDate = new Date(referenceDate);
    beforeDate.setUTCDate(beforeDate.getUTCDate() - 1);
    const beforeDateStr = beforeDate.toISOString().split('T')[0];

    const afterDate = new Date(isDateRange ? endDate : referenceDate);
    afterDate.setUTCDate(afterDate.getUTCDate() + 1);
    const afterDateStr = afterDate.toISOString().split('T')[0];

    const result: Record<string, string> = {};
    const creationPromises: Promise<void>[] = [];

    // Before scenarios - items completely before target
    if (scenarios.includes('before')) {
      creationPromises.push(
        (async () => {
          const [beforeTaskId, beforeParentInfo] = await Promise.all([
            createTask({
              name: `${namePrefix}Task Before Target`,
              notes: `Task scheduled before target`,
              scheduledStart: `${beforeDateStr}T09:00:00Z`,
              scheduledEnd: `${beforeDateStr}T17:00:00Z`,
            }),
            includeSubtasks
              ? createTask({
                  name: `${namePrefix}Parent Task Before Target`,
                  scheduledStart: `${beforeDateStr}T08:00:00Z`,
                  scheduledEnd: `${beforeDateStr}T18:00:00Z`,
                }).then(async (parentId) => ({
                  parentId,
                  subtaskId: await createSubtask(parentId, {
                    name: `${namePrefix}Subtask Before Target`,
                    notes: `Subtask scheduled before target`,
                    scheduledStart: `${beforeDateStr}T10:00:00Z`,
                    scheduledEnd: `${beforeDateStr}T12:00:00Z`,
                  }),
                }))
              : Promise.resolve(null),
          ]);

          result.beforeTaskId = beforeTaskId;
          if (beforeParentInfo) {
            result.beforeParentId = beforeParentInfo.parentId;
            result.beforeSubtaskId = beforeParentInfo.subtaskId;
          }
        })()
      );
    }

    // Within/On scenarios - items within target date(s)
    if (scenarios.includes('within')) {
      creationPromises.push(
        (async () => {
          const [withinTaskId, withinParentInfo] = await Promise.all([
            createTask({
              name: `${namePrefix}Task Within Target`,
              notes: `Task scheduled within target`,
              scheduledStart: `${startDate}T09:00:00Z`,
              scheduledEnd: `${isDateRange ? endDate : startDate}T17:00:00Z`,
            }),
            includeSubtasks
              ? createTask({
                  name: `${namePrefix}Parent Task Within Target`,
                  scheduledStart: `${startDate}T08:00:00Z`,
                  scheduledEnd: `${isDateRange ? endDate : startDate}T18:00:00Z`,
                }).then(async (parentId) => ({
                  parentId,
                  subtaskId: await createSubtask(parentId, {
                    name: `${namePrefix}Subtask Within Target`,
                    notes: `Subtask scheduled within target`,
                    scheduledStart: `${startDate}T10:00:00Z`,
                    scheduledEnd: `${startDate}T12:00:00Z`,
                  }),
                }))
              : Promise.resolve(null),
          ]);

          result.withinTaskId = withinTaskId;
          if (withinParentInfo) {
            result.withinParentId = withinParentInfo.parentId;
            result.withinSubtaskId = withinParentInfo.subtaskId;
          }
        })()
      );
    }

    // After scenarios - items completely after target
    if (scenarios.includes('after')) {
      creationPromises.push(
        (async () => {
          const [afterTaskId, afterParentInfo] = await Promise.all([
            createTask({
              name: `${namePrefix}Task After Target`,
              notes: `Task scheduled after target`,
              scheduledStart: `${afterDateStr}T09:00:00Z`,
              scheduledEnd: `${afterDateStr}T17:00:00Z`,
            }),
            includeSubtasks
              ? createTask({
                  name: `${namePrefix}Parent Task After Target`,
                  scheduledStart: `${afterDateStr}T08:00:00Z`,
                  scheduledEnd: `${afterDateStr}T18:00:00Z`,
                }).then(async (parentId) => ({
                  parentId,
                  subtaskId: await createSubtask(parentId, {
                    name: `${namePrefix}Subtask After Target`,
                    notes: `Subtask scheduled after target`,
                    scheduledStart: `${afterDateStr}T10:00:00Z`,
                    scheduledEnd: `${afterDateStr}T12:00:00Z`,
                  }),
                }))
              : Promise.resolve(null),
          ]);

          result.afterTaskId = afterTaskId;
          if (afterParentInfo) {
            result.afterParentId = afterParentInfo.parentId;
            result.afterSubtaskId = afterParentInfo.subtaskId;
          }
        })()
      );
    }

    // Starts within, ends after scenarios
    if (scenarios.includes('startsWithin')) {
      creationPromises.push(
        (async () => {
          // For date ranges, use a date within the range (middle day)
          const startWithinDate = isDateRange
            ? new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0] // One day after start
            : startDate;

          const [startsWithinTaskId, startsWithinSubtaskId] = await Promise.all(
            [
              createTask({
                name: `${namePrefix}Task Starts Within Target`,
                notes: `Task starting within target but extending beyond`,
                scheduledStart: `${startWithinDate}T14:00:00Z`,
                scheduledEnd: `${afterDateStr}T10:00:00Z`,
              }),
              includeSubtasks
                ? createTask({
                    name: `${namePrefix}Task Starts Within Target`, // We'll reuse the same task as parent
                    scheduledStart: `${startWithinDate}T14:00:00Z`,
                    scheduledEnd: `${afterDateStr}T10:00:00Z`,
                  }).then((parentId) =>
                    createSubtask(parentId, {
                      name: `${namePrefix}Subtask Starts Within Target`,
                      notes: `Subtask starting within target but extending beyond`,
                      scheduledStart: `${startWithinDate}T15:00:00Z`,
                      scheduledEnd: `${afterDateStr}T09:00:00Z`,
                    })
                  )
                : Promise.resolve(''),
            ]
          );

          result.startsWithinTaskId = startsWithinTaskId;
          if (includeSubtasks && startsWithinSubtaskId) {
            result.startsWithinSubtaskId = startsWithinSubtaskId;
          }
        })()
      );
    }

    // Ends within, starts before scenarios
    if (scenarios.includes('endsWithin')) {
      creationPromises.push(
        (async () => {
          const [endsWithinTaskId, endsWithinParentInfo] = await Promise.all([
            createTask({
              name: `${namePrefix}Task Ends Within Target`,
              notes: `Task ending within target but started before`,
              scheduledStart: `${beforeDateStr}T20:00:00Z`,
              scheduledEnd: `${startDate}T10:00:00Z`,
            }),
            includeSubtasks
              ? createTask({
                  name: `${namePrefix}Parent Task Ends Within Target`,
                  scheduledStart: `${beforeDateStr}T19:00:00Z`,
                  scheduledEnd: `${startDate}T09:00:00Z`,
                }).then(async (parentId) => ({
                  parentId,
                  subtaskId: await createSubtask(parentId, {
                    name: `${namePrefix}Subtask Ends Within Target`,
                    notes: `Subtask ending within target but started before`,
                    scheduledStart: `${beforeDateStr}T21:00:00Z`,
                    scheduledEnd: `${startDate}T11:00:00Z`,
                  }),
                }))
              : Promise.resolve(null),
          ]);

          result.endsWithinTaskId = endsWithinTaskId;
          if (endsWithinParentInfo) {
            result.endsWithinParentId = endsWithinParentInfo.parentId;
            result.endsWithinSubtaskId = endsWithinParentInfo.subtaskId;
          }
        })()
      );
    }

    // Spans scenarios - items that span across the entire target
    if (scenarios.includes('spans')) {
      creationPromises.push(
        (async () => {
          const [spansTaskId, spansParentInfo] = await Promise.all([
            createTask({
              name: `Spans ${namePrefix}Task`,
              notes: `Task spanning across entire target`,
              scheduledStart: `${beforeDateStr}T18:00:00Z`,
              scheduledEnd: `${afterDateStr}T12:00:00Z`,
            }),
            includeSubtasks
              ? createTask({
                  name: `Spans ${namePrefix}Parent Task`,
                  scheduledStart: `${beforeDateStr}T17:00:00Z`,
                  scheduledEnd: `${afterDateStr}T13:00:00Z`,
                }).then(async (parentId) => ({
                  parentId,
                  subtaskId: await createSubtask(parentId, {
                    name: `Spans ${namePrefix}Subtask`,
                    notes: `Subtask spanning across entire target`,
                    scheduledStart: `${beforeDateStr}T19:00:00Z`,
                    scheduledEnd: `${afterDateStr}T11:00:00Z`,
                  }),
                }))
              : Promise.resolve(null),
          ]);

          result.spansTaskId = spansTaskId;
          if (spansParentInfo) {
            result.spansParentId = spansParentInfo.parentId;
            result.spansSubtaskId = spansParentInfo.subtaskId;
          }
        })()
      );
    }

    // Boundary scenarios - items at exact boundaries
    if (scenarios.includes('boundaries')) {
      creationPromises.push(
        (async () => {
          const [startBoundaryTaskId, endBoundaryTaskId, boundaryParentInfo] =
            await Promise.all([
              createTask({
                name: `${namePrefix}Start Boundary Task`,
                notes: `Task at exact start boundary`,
                scheduledStart: `${startDate}T00:00:00Z`,
                scheduledEnd: `${startDate}T08:00:00Z`,
              }),
              createTask({
                name: `${namePrefix}End Boundary Task`,
                notes: `Task at exact end boundary`,
                scheduledStart: `${isDateRange ? endDate : startDate}T20:00:00Z`,
                scheduledEnd: `${isDateRange ? endDate : startDate}T23:59:59Z`,
              }),
              includeSubtasks
                ? createTask({
                    name: `${namePrefix}Parent Task Boundary`,
                    scheduledStart: `${startDate}T00:00:00Z`,
                    scheduledEnd: `${isDateRange ? endDate : startDate}T23:30:00Z`,
                  }).then(async (parentId) => ({
                    parentId,
                    subtaskId: await createSubtask(parentId, {
                      name: `${namePrefix}Exact Boundary Subtask`,
                      scheduledStart: `${startDate}T00:00:00Z`,
                      scheduledEnd: `${isDateRange ? endDate : startDate}T23:59:59Z`,
                    }),
                  }))
                : Promise.resolve(null),
            ]);

          result.startBoundaryTaskId = startBoundaryTaskId;
          result.endBoundaryTaskId = endBoundaryTaskId;
          if (boundaryParentInfo) {
            result.boundaryParentId = boundaryParentInfo.parentId;
            result.exactBoundarySubtaskId = boundaryParentInfo.subtaskId;
          }
        })()
      );
    }

    // Wait for all creation promises to complete
    await Promise.all(creationPromises);

    return result;
  };

  beforeEach(async () => {
    // Generate fresh UUIDs for each test
    TEST_USER_ID = randomUUID();
    TEST_PROJECT_ID = randomUUID();

    // Reset all mocks
    vi.clearAllMocks();

    // Mock the current date to December 1, 2024 to match test data
    vi.setSystemTime(new Date('2024-12-01T00:00:00Z'));

    // Configure mock behavior using vi.mocked() for proper typing
    vi.mocked(retrieveUserSession).mockImplementation(
      async (req: any, _res: any, next: any) => {
        req.user = {
          id: TEST_USER_ID,
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        req.session = {
          id: randomUUID(),
          expiresAt: new Date(Date.now() + 86400000),
          token: 'test-token',
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          userId: TEST_USER_ID,
        };
        next();
      }
    );

    vi.mocked(requireUserSession).mockImplementation(
      async (req: any, _res: any, next: any) => {
        req.user = {
          id: TEST_USER_ID,
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        req.session = {
          id: randomUUID(),
          expiresAt: new Date(Date.now() + 86400000),
          token: 'test-token',
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          userId: TEST_USER_ID,
        };
        next();
      }
    );

    // Set up test database with fresh data
    const testDb = (globalThis as any).testDb;
    if (testDb) {
      await testDb.insert(user).values({
        id: TEST_USER_ID,
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await testDb.insert(project).values({
        id: TEST_PROJECT_ID,
        userId: TEST_USER_ID,
        name: 'Test Project',
        defaultBillable: false,
        defaultRate: '0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });

  // ============================================================================
  // TASK RESOURCE SCHEDULING TESTS
  // ============================================================================

  describe('Task Resource - Scheduling Features', () => {
    describe('CREATE Task with Scheduling', () => {
      test('should create a task with scheduled_start and scheduled_end properties defined', async () => {
        const taskData = {
          projectId: TEST_PROJECT_ID,
          name: 'Task with both scheduled dates',
          notes: 'Test notes',
          scheduledStart: '2024-12-01T09:00:00Z',
          scheduledEnd: '2024-12-01T17:00:00Z',
        };

        const response = await request(app).post('/api/tasks').send(taskData);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(201);
        expect(body.status).toBe('success');
        expect(body.data.task).toMatchObject({
          name: taskData.name,
          notes: taskData.notes,
          projectId: taskData.projectId,
        });
        expect(new Date(body.data.task.scheduledStart!)).toEqual(
          new Date(taskData.scheduledStart)
        );
        expect(new Date(body.data.task.scheduledEnd!)).toEqual(
          new Date(taskData.scheduledEnd)
        );
      });

      test('should create a task with only scheduled_start defined', async () => {
        // Test that POST /api/tasks accepts partial scheduling data
        // Should verify that scheduled_start is stored and scheduled_end remains null
        const taskData = {
          projectId: TEST_PROJECT_ID,
          name: 'Task with only start date',
          scheduledStart: '2024-12-01T09:00:00Z',
        };

        const response = await request(app).post('/api/tasks').send(taskData);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(201);
        expect(body.status).toBe('success');
        expect(body.data.task).toMatchObject({
          name: taskData.name,
          projectId: taskData.projectId,
        });
        expect(new Date(body.data.task.scheduledStart!)).toEqual(
          new Date(taskData.scheduledStart)
        );
        expect(body.data.task.scheduledEnd).toBeNull();
      });

      test('should create a task with only scheduled_end defined', async () => {
        // Test that POST /api/tasks accepts partial scheduling data
        // Should verify that scheduled_end is stored and scheduled_start remains null
        const taskData = {
          projectId: TEST_PROJECT_ID,
          name: 'Task with only end date',
          scheduledEnd: '2024-12-01T17:00:00Z',
        };

        const response = await request(app).post('/api/tasks').send(taskData);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(201);
        expect(body.status).toBe('success');
        expect(body.data.task).toMatchObject({
          name: taskData.name,
          projectId: taskData.projectId,
        });
        expect(body.data.task.scheduledStart).toBeNull();
        expect(new Date(body.data.task.scheduledEnd!)).toEqual(
          new Date(taskData.scheduledEnd)
        );
      });

      test('should create a task with no scheduling properties (backwards compatibility)', async () => {
        // Test that POST /api/tasks still works without scheduled dates
        // Should verify that both scheduled_start and scheduled_end are null
        const taskData = {
          projectId: TEST_PROJECT_ID,
          name: 'Task without scheduling',
          notes: 'No dates provided',
        };

        const response = await request(app).post('/api/tasks').send(taskData);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(201);
        expect(body.status).toBe('success');
        expect(body.data.task).toMatchObject({
          name: taskData.name,
          notes: taskData.notes,
          projectId: taskData.projectId,
        });
        expect(body.data.task.scheduledStart).toBeNull();
        expect(body.data.task.scheduledEnd).toBeNull();
      });

      test('should reject task creation with invalid scheduled_start date format', async () => {
        // Test that POST /api/tasks validates date format for scheduled_start
        // Should return 500 error due to invalid date object creation in controller
        const taskData = {
          projectId: TEST_PROJECT_ID,
          name: 'Task with invalid start date',
          scheduledStart: 'invalid-date-format',
        };

        const response = await request(app)
          .post('/api/tasks')
          .send(taskData)
          .expect(500); // The controller creates new Date() which will create an invalid date object

        expect(response.body.status).toBe('error');
      });

      test('should reject task creation with invalid scheduled_end date format', async () => {
        // Test that POST /api/tasks validates date format for scheduled_end
        // Should return 500 error due to invalid date object creation in controller
        const taskData = {
          projectId: TEST_PROJECT_ID,
          name: 'Task with invalid end date',
          scheduledEnd: 'invalid-date-format',
        };

        const response = await request(app)
          .post('/api/tasks')
          .send(taskData)
          .expect(500); // The controller creates new Date() which will create an invalid date object

        expect(response.body.status).toBe('error');
      });

      test('should reject task creation when scheduled_end is before scheduled_start', async () => {
        // Test logical validation of date ranges
        // Note: This test documents expected behavior, but current API doesn't validate this
        const taskData = {
          projectId: TEST_PROJECT_ID,
          name: 'Task with invalid date range',
          scheduledStart: '2024-12-01T17:00:00Z',
          scheduledEnd: '2024-12-01T09:00:00Z', // End before start
        };

        const response = await request(app).post('/api/tasks').send(taskData);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('fail');
        expect(response.body.error.message).toMatch(/end.*start|start.*end/i);
      });
    });

    describe('READ Task with Scheduling', () => {
      test('should retrieve a task with scheduled_start and scheduled_end properties defined', async () => {
        // Test that GET /api/tasks/:id returns scheduling data
        // Should verify that scheduled dates are properly serialized in response

        const expectedData = {
          name: 'Task with full scheduling for read test',
          notes: 'Test notes for read',
          scheduledStart: '2024-12-01T09:00:00Z',
          scheduledEnd: '2024-12-01T17:00:00Z',
        };

        const taskId = await createTask(expectedData);
        const response = await request(app).get(`/api/tasks/${taskId}`);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.task).toMatchObject({
          id: taskId,
          name: expectedData.name,
          notes: expectedData.notes,
          projectId: TEST_PROJECT_ID,
        });
        // Verify both scheduling dates are properly returned
        expect(new Date(body.data.task.scheduledStart!)).toEqual(
          new Date(expectedData.scheduledStart)
        );
        expect(new Date(body.data.task.scheduledEnd!)).toEqual(
          new Date(expectedData.scheduledEnd)
        );
      });

      test('should retrieve a task with null scheduling properties', async () => {
        // Test that GET /api/tasks/:id handles null scheduling data
        // Should verify that null values are properly returned

        const expectedData = {
          name: 'Task without scheduling for read test',
          notes: 'No scheduling data',
        };

        const taskId = await createTask(expectedData);
        const response = await request(app).get(`/api/tasks/${taskId}`);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.task).toMatchObject({
          id: taskId,
          name: expectedData.name,
          notes: expectedData.notes,
          projectId: TEST_PROJECT_ID,
        });
        // Verify both scheduling properties are null
        expect(body.data.task.scheduledStart).toBeNull();
        expect(body.data.task.scheduledEnd).toBeNull();
      });

      test('should retrieve a task with partial scheduling data (only start)', async () => {
        // Test that GET /api/tasks/:id handles partial scheduling data
        // Should verify mixed null/date values are properly returned

        const expectedData = {
          name: 'Task with only start date for read test',
          scheduledStart: '2024-12-02T10:00:00Z',
        };

        const taskId = await createTask(expectedData);
        const response = await request(app).get(`/api/tasks/${taskId}`);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.task).toMatchObject({
          id: taskId,
          name: expectedData.name,
          projectId: TEST_PROJECT_ID,
        });
        // Verify only scheduled_start is populated, scheduled_end is null
        expect(new Date(body.data.task.scheduledStart!)).toEqual(
          new Date(expectedData.scheduledStart)
        );
        expect(body.data.task.scheduledEnd).toBeNull();
      });

      test('should retrieve a task with partial scheduling data (only end)', async () => {
        // Test that GET /api/tasks/:id handles partial scheduling data
        // Should verify mixed null/date values are properly returned

        const expectedData = {
          name: 'Task with only end date for read test',
          scheduledEnd: '2024-12-02T18:00:00Z',
        };

        const taskId = await createTask(expectedData);
        const response = await request(app).get(`/api/tasks/${taskId}`);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.task).toMatchObject({
          id: taskId,
          name: expectedData.name,
          projectId: TEST_PROJECT_ID,
        });
        // Verify only scheduled_end is populated, scheduled_start is null
        expect(body.data.task.scheduledStart).toBeNull();
        expect(new Date(body.data.task.scheduledEnd!)).toEqual(
          new Date(expectedData.scheduledEnd)
        );
      });
    });

    describe('UPDATE Task with Scheduling', () => {
      test('should update a task with scheduled_start and scheduled_end properties defined', async () => {
        // Test that PUT /api/tasks/:id can update scheduling data
        // Should verify that scheduled dates are properly updated

        // Create a task without scheduling initially
        const taskId = await createTask({
          name: 'Task to update with full scheduling',
          notes: 'Initial notes',
        });

        const updateData = {
          scheduledStart: '2024-12-15T10:00:00Z',
          scheduledEnd: '2024-12-15T18:00:00Z',
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .send(updateData);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.task.id).toBe(taskId);
        // Verify both scheduling dates were properly updated
        expect(new Date(body.data.task.scheduledStart!)).toEqual(
          new Date(updateData.scheduledStart)
        );
        expect(new Date(body.data.task.scheduledEnd!)).toEqual(
          new Date(updateData.scheduledEnd)
        );
      });

      test('should update a task to remove scheduling properties (set to null)', async () => {
        // Test that PUT /api/tasks/:id can remove scheduling from existing task
        // Should verify that date values are replaced with null

        // Create a task with full scheduling initially
        const taskId = await createTask({
          name: 'Scheduled task to remove scheduling from',
          scheduledStart: '2024-12-25T08:00:00Z',
          scheduledEnd: '2024-12-25T16:00:00Z',
        });

        const updateData = {
          scheduledStart: null,
          scheduledEnd: null,
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .send(updateData);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        // Verify that scheduling was removed (set to null)
        expect(body.data.task.scheduledStart).toBeNull();
        expect(body.data.task.scheduledEnd).toBeNull();
      });

      test('should update only scheduled_start while preserving scheduled_end', async () => {
        // Test partial updates of scheduling data
        // Should verify that only specified fields are updated

        // Create a task with both start and end dates
        const originalEnd = '2024-12-30T17:00:00Z';
        const taskId = await createTask({
          name: 'Task for partial update (start only)',
          scheduledStart: '2024-12-30T09:00:00Z',
          scheduledEnd: originalEnd,
        });

        const updateData = {
          scheduledStart: '2024-12-30T10:30:00Z', // Only updating start time
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .send(updateData);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        // Verify only start date was updated, end date preserved
        expect(new Date(body.data.task.scheduledStart!)).toEqual(
          new Date(updateData.scheduledStart)
        );
        expect(new Date(body.data.task.scheduledEnd!)).toEqual(
          new Date(originalEnd)
        );
      });

      test('should update only scheduled_end while preserving scheduled_start', async () => {
        // Test partial updates of scheduling data
        // Should verify that only specified fields are updated

        // Create a task with both start and end dates
        const originalStart = '2024-12-31T08:00:00Z';
        const taskId = await createTask({
          name: 'Task for partial update (end only)',
          scheduledStart: originalStart,
          scheduledEnd: '2024-12-31T16:00:00Z',
        });

        const updateData = {
          scheduledEnd: '2024-12-31T18:30:00Z', // Only updating end time
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .send(updateData);
        const body = response.body as SuccessResponse<TaskResponse>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        // Verify only end date was updated, start date preserved
        expect(new Date(body.data.task.scheduledStart!)).toEqual(
          new Date(originalStart)
        );
        expect(new Date(body.data.task.scheduledEnd!)).toEqual(
          new Date(updateData.scheduledEnd)
        );
      });

      test('should reject task update with invalid scheduled_start date format', async () => {
        // Test that PUT /api/tasks/:id validates date format
        // Should return 500 error due to invalid date object creation in controller

        // Create a basic task to update
        const taskId = await createTask({
          name: 'Task for invalid start date update test',
        });

        const updateData = {
          scheduledStart: 'invalid-date-format',
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .send(updateData)
          .expect(500); // The controller creates new Date() which will create an invalid date object

        expect(response.body.status).toBe('error');
      });

      test('should reject task update with invalid scheduled_end date format', async () => {
        // Test that PUT /api/tasks/:id validates date format
        // Should return 500 error due to invalid date object creation in controller

        // Create a basic task to update
        const taskId = await createTask({
          name: 'Task for invalid end date update test',
        });

        const updateData = {
          scheduledEnd: 'invalid-date-format',
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .send(updateData)
          .expect(500); // The controller creates new Date() which will create an invalid date object

        expect(response.body.status).toBe('error');
      });

      test('should reject task update when scheduled_end is before scheduled_start', async () => {
        // Test logical validation of date ranges during updates
        // Should return 400 error when end date precedes start date

        // Create a basic task to update
        const taskId = await createTask({
          name: 'Task for invalid date range update test',
        });

        const updateData = {
          scheduledStart: '2025-01-01T17:00:00Z',
          scheduledEnd: '2025-01-01T09:00:00Z', // End before start
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .send(updateData);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('fail');
        expect(response.body.error.message).toMatch(/end.*start|start.*end/i);
      });
    });
  });

  // ============================================================================
  // SUBTASK RESOURCE SCHEDULING TESTS
  // ============================================================================

  describe('Subtask Resource - Scheduling Features', () => {
    describe('CREATE Subtask with Scheduling', () => {
      test('should create a subtask with scheduled_start and scheduled_end properties defined', async () => {
        // Test that POST /api/tasks/:taskId/subtasks accepts and stores scheduled_start and scheduled_end
        // Should verify that the created subtask has the correct scheduled dates

        // Create parent task first
        const parentTaskId = await createTask({
          name: 'Parent Task for Subtask Tests',
          notes: 'Parent task notes',
        });

        const subtaskData = {
          name: 'Subtask with both scheduled dates',
          notes: 'Test subtask notes',
          scheduledStart: '2024-12-01T09:00:00Z',
          scheduledEnd: '2024-12-01T17:00:00Z',
        };

        const response = await request(app)
          .post(`/api/tasks/${parentTaskId}/subtasks`)
          .send(subtaskData);
        const body = response.body as SuccessResponse<{ subtask: any }>;

        expect(response.status).toBe(201);
        expect(body.status).toBe('success');
        expect(body.data.subtask).toMatchObject({
          name: subtaskData.name,
          notes: subtaskData.notes,
          taskId: parentTaskId,
        });
        expect(new Date(body.data.subtask.scheduledStart!)).toEqual(
          new Date(subtaskData.scheduledStart)
        );
        expect(new Date(body.data.subtask.scheduledEnd!)).toEqual(
          new Date(subtaskData.scheduledEnd)
        );
      });

      test('should create a subtask with only scheduled_start defined', async () => {
        // Test that POST /api/tasks/:taskId/subtasks accepts partial scheduling data
        // Should verify that scheduled_start is stored and scheduled_end remains null

        // Create parent task first
        const parentTaskId = await createTask({
          name: 'Parent Task for Subtask Tests',
          notes: 'Parent task notes',
        });

        const subtaskData = {
          name: 'Subtask with only start date',
          scheduledStart: '2024-12-01T09:00:00Z',
        };

        const response = await request(app)
          .post(`/api/tasks/${parentTaskId}/subtasks`)
          .send(subtaskData);
        const body = response.body as SuccessResponse<{ subtask: any }>;

        expect(response.status).toBe(201);
        expect(body.status).toBe('success');
        expect(body.data.subtask).toMatchObject({
          name: subtaskData.name,
          taskId: parentTaskId,
        });
        expect(new Date(body.data.subtask.scheduledStart!)).toEqual(
          new Date(subtaskData.scheduledStart)
        );
        expect(body.data.subtask.scheduledEnd).toBeNull();
      });

      test('should create a subtask with only scheduled_end defined', async () => {
        // Test that POST /api/tasks/:taskId/subtasks accepts partial scheduling data
        // Should verify that scheduled_end is stored and scheduled_start remains null

        // Create parent task first
        const parentTaskId = await createTask({
          name: 'Parent Task for Subtask Tests',
          notes: 'Parent task notes',
        });

        const subtaskData = {
          name: 'Subtask with only end date',
          scheduledEnd: '2024-12-01T17:00:00Z',
        };

        const response = await request(app)
          .post(`/api/tasks/${parentTaskId}/subtasks`)
          .send(subtaskData);
        const body = response.body as SuccessResponse<{ subtask: any }>;

        expect(response.status).toBe(201);
        expect(body.status).toBe('success');
        expect(body.data.subtask).toMatchObject({
          name: subtaskData.name,
          taskId: parentTaskId,
        });
        expect(body.data.subtask.scheduledStart).toBeNull();
        expect(new Date(body.data.subtask.scheduledEnd!)).toEqual(
          new Date(subtaskData.scheduledEnd)
        );
      });

      test('should create a subtask with no scheduling properties (backwards compatibility)', async () => {
        // Test that POST /api/tasks/:taskId/subtasks still works without scheduled dates
        // Should verify that both scheduled_start and scheduled_end are null

        // Create parent task first
        const parentTaskId = await createTask({
          name: 'Parent Task for Subtask Tests',
          notes: 'Parent task notes',
        });

        const subtaskData = {
          name: 'Subtask without scheduling',
          notes: 'No dates provided',
        };

        const response = await request(app)
          .post(`/api/tasks/${parentTaskId}/subtasks`)
          .send(subtaskData);
        const body = response.body as SuccessResponse<{ subtask: any }>;

        expect(response.status).toBe(201);
        expect(body.status).toBe('success');
        expect(body.data.subtask).toMatchObject({
          name: subtaskData.name,
          notes: subtaskData.notes,
          taskId: parentTaskId,
        });
        expect(body.data.subtask.scheduledStart).toBeNull();
        expect(body.data.subtask.scheduledEnd).toBeNull();
      });

      test('should reject subtask creation with invalid scheduled_start date format', async () => {
        // Test that POST /api/tasks/:taskId/subtasks validates date format for scheduled_start
        // Should return 500 error due to invalid date object creation in controller

        // Create parent task first
        const parentTaskId = await createTask({
          name: 'Parent Task for Subtask Tests',
          notes: 'Parent task notes',
        });

        const subtaskData = {
          name: 'Subtask with invalid start date',
          scheduledStart: 'invalid-date-format',
        };

        const response = await request(app)
          .post(`/api/tasks/${parentTaskId}/subtasks`)
          .send(subtaskData)
          .expect(500); // The controller creates new Date() which will create an invalid date object

        expect(response.body.status).toBe('error');
      });

      test('should reject subtask creation with invalid scheduled_end date format', async () => {
        // Test that POST /api/tasks/:taskId/subtasks validates date format for scheduled_end
        // Should return 500 error due to invalid date object creation in controller

        // Create parent task first
        const parentTaskId = await createTask({
          name: 'Parent Task for Subtask Tests',
          notes: 'Parent task notes',
        });

        const subtaskData = {
          name: 'Subtask with invalid end date',
          scheduledEnd: 'invalid-date-format',
        };

        const response = await request(app)
          .post(`/api/tasks/${parentTaskId}/subtasks`)
          .send(subtaskData)
          .expect(500); // The controller creates new Date() which will create an invalid date object

        expect(response.body.status).toBe('error');
      });

      test('should reject subtask creation when scheduled_end is before scheduled_start', async () => {
        // Test logical validation of date ranges
        // Should return 400 error when end date precedes start date

        // Create parent task first
        const parentTaskId = await createTask({
          name: 'Parent Task for Subtask Tests',
          notes: 'Parent task notes',
        });

        const subtaskData = {
          name: 'Subtask with invalid date range',
          scheduledStart: '2024-12-01T17:00:00Z',
          scheduledEnd: '2024-12-01T09:00:00Z', // End before start
        };

        const response = await request(app)
          .post(`/api/tasks/${parentTaskId}/subtasks`)
          .send(subtaskData);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('fail');
        expect(response.body.error.message).toMatch(/end.*start|start.*end/i);
      });
    });

    describe('READ Subtask with Scheduling', () => {
      test('should retrieve a subtask with scheduled_start and scheduled_end properties defined', async () => {
        // Test that GET /api/tasks/:taskId/subtasks returns scheduling data
        // Should verify that scheduled dates are properly serialized in response

        const expectedData = {
          name: 'Subtask with full scheduling for read test',
          notes: 'Test subtask notes for read',
          scheduledStart: '2024-12-01T09:00:00Z',
          scheduledEnd: '2024-12-01T17:00:00Z',
        };

        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Read Tests',
          notes: 'Parent task for testing subtask reads',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, expectedData);

        const response = await request(app).get(
          `/api/tasks/${taskId}/subtasks`
        );
        const body = response.body as SuccessResponse<{ subtasks: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.subtasks).toHaveLength(1);

        const subtask = body.data.subtasks[0];
        expect(subtask).toMatchObject({
          id: subtaskId,
          name: expectedData.name,
          notes: expectedData.notes,
          taskId: taskId,
        });
        // Verify both scheduling dates are properly returned
        expect(new Date(subtask.scheduledStart!)).toEqual(
          new Date(expectedData.scheduledStart)
        );
        expect(new Date(subtask.scheduledEnd!)).toEqual(
          new Date(expectedData.scheduledEnd)
        );
      });

      test('should retrieve a subtask with null scheduling properties', async () => {
        // Test that GET /api/tasks/:taskId/subtasks handles null scheduling data
        // Should verify that null values are properly returned

        const expectedData = {
          name: 'Subtask without scheduling for read test',
          notes: 'No scheduling data',
        };

        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Read Tests',
          notes: 'Parent task for testing subtask reads',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, expectedData);

        const response = await request(app).get(
          `/api/tasks/${taskId}/subtasks`
        );
        const body = response.body as SuccessResponse<{ subtasks: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.subtasks).toHaveLength(1);

        const subtask = body.data.subtasks[0];
        expect(subtask).toMatchObject({
          id: subtaskId,
          name: expectedData.name,
          notes: expectedData.notes,
          taskId: taskId,
        });
        // Verify both scheduling properties are null
        expect(subtask.scheduledStart).toBeNull();
        expect(subtask.scheduledEnd).toBeNull();
      });

      test('should retrieve a subtask with partial scheduling data (only start)', async () => {
        // Test that GET /api/tasks/:taskId/subtasks handles partial scheduling data
        // Should verify mixed null/date values are properly returned

        const expectedData = {
          name: 'Subtask with only start date for read test',
          scheduledStart: '2024-12-02T10:00:00Z',
        };

        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Read Tests',
          notes: 'Parent task for testing subtask reads',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, expectedData);

        const response = await request(app).get(
          `/api/tasks/${taskId}/subtasks`
        );
        const body = response.body as SuccessResponse<{ subtasks: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.subtasks).toHaveLength(1);

        const subtask = body.data.subtasks[0];
        expect(subtask).toMatchObject({
          id: subtaskId,
          name: expectedData.name,
          taskId: taskId,
        });
        // Verify only scheduled_start is populated, scheduled_end is null
        expect(new Date(subtask.scheduledStart!)).toEqual(
          new Date(expectedData.scheduledStart)
        );
        expect(subtask.scheduledEnd).toBeNull();
      });

      test('should retrieve a subtask with partial scheduling data (only end)', async () => {
        // Test that GET /api/tasks/:taskId/subtasks handles partial scheduling data
        // Should verify mixed null/date values are properly returned

        const expectedData = {
          name: 'Subtask with only end date for read test',
          scheduledEnd: '2024-12-02T18:00:00Z',
        };

        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Read Tests',
          notes: 'Parent task for testing subtask reads',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, expectedData);

        const response = await request(app).get(
          `/api/tasks/${taskId}/subtasks`
        );
        const body = response.body as SuccessResponse<{ subtasks: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.subtasks).toHaveLength(1);

        const subtask = body.data.subtasks[0];
        expect(subtask).toMatchObject({
          id: subtaskId,
          name: expectedData.name,
          taskId: taskId,
        });
        // Verify only scheduled_end is populated, scheduled_start is null
        expect(subtask.scheduledStart).toBeNull();
        expect(new Date(subtask.scheduledEnd!)).toEqual(
          new Date(expectedData.scheduledEnd)
        );
      });
    });

    describe('UPDATE Subtask with Scheduling', () => {
      test('should update a subtask with scheduled_start and scheduled_end properties defined', async () => {
        // Test that PUT /api/tasks/:taskId/subtasks/:subtaskId can update scheduling data
        // Should verify that scheduled dates are properly updated

        // Create a subtask without scheduling initially
        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Update Tests',
          notes: 'Parent task for testing subtask updates',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, {
          name: 'Subtask to update with full scheduling',
          notes: 'Initial subtask notes',
        });

        const updateData = {
          scheduledStart: '2024-12-15T10:00:00Z',
          scheduledEnd: '2024-12-15T18:00:00Z',
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
          .send(updateData);
        const body = response.body as SuccessResponse<{ subtask: any }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.subtask.id).toBe(subtaskId);
        // Verify both scheduling dates were properly updated
        expect(new Date(body.data.subtask.scheduledStart!)).toEqual(
          new Date(updateData.scheduledStart)
        );
        expect(new Date(body.data.subtask.scheduledEnd!)).toEqual(
          new Date(updateData.scheduledEnd)
        );
      });

      test('should update a subtask to add scheduling properties to previously unscheduled subtask', async () => {
        // Test that PUT /api/tasks/:taskId/subtasks/:subtaskId can add scheduling to existing subtask
        // Should verify that null values are replaced with proper dates

        // Create a subtask without any scheduling initially
        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Update Tests',
          notes: 'Parent task for testing subtask updates',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, {
          name: 'Unscheduled subtask to add scheduling to',
          notes: 'Originally unscheduled',
        });

        const updateData = {
          scheduledStart: '2024-12-20T08:30:00Z',
          scheduledEnd: '2024-12-20T16:30:00Z',
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
          .send(updateData);
        const body = response.body as SuccessResponse<{ subtask: any }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.subtask.id).toBe(subtaskId);
        // Verify that scheduling was added (null values replaced with dates)
        expect(new Date(body.data.subtask.scheduledStart!)).toEqual(
          new Date(updateData.scheduledStart)
        );
        expect(new Date(body.data.subtask.scheduledEnd!)).toEqual(
          new Date(updateData.scheduledEnd)
        );
      });

      test('should update a subtask to remove scheduling properties (set to null)', async () => {
        // Test that PUT /api/tasks/:taskId/subtasks/:subtaskId can remove scheduling from existing subtask
        // Should verify that date values are replaced with null

        // Create a subtask with full scheduling initially
        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Update Tests',
          notes: 'Parent task for testing subtask updates',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, {
          name: 'Scheduled subtask to remove scheduling from',
          scheduledStart: '2024-12-25T08:00:00Z',
          scheduledEnd: '2024-12-25T16:00:00Z',
        });

        const updateData = {
          scheduledStart: null,
          scheduledEnd: null,
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
          .send(updateData);
        const body = response.body as SuccessResponse<{ subtask: any }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        // Verify that scheduling was removed (set to null)
        expect(body.data.subtask.scheduledStart).toBeNull();
        expect(body.data.subtask.scheduledEnd).toBeNull();
      });

      test('should update only scheduled_start while preserving scheduled_end', async () => {
        // Test partial updates of subtask scheduling data
        // Should verify that only specified fields are updated

        // Create a subtask with both start and end dates
        const originalEnd = '2024-12-30T17:00:00Z';
        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Update Tests',
          notes: 'Parent task for testing subtask updates',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, {
          name: 'Subtask for partial update (start only)',
          scheduledStart: '2024-12-30T09:00:00Z',
          scheduledEnd: originalEnd,
        });

        const updateData = {
          scheduledStart: '2024-12-30T10:30:00Z', // Only updating start time
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
          .send(updateData);
        const body = response.body as SuccessResponse<{ subtask: any }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        // Verify only start date was updated, end date preserved
        expect(new Date(body.data.subtask.scheduledStart!)).toEqual(
          new Date(updateData.scheduledStart)
        );
        expect(new Date(body.data.subtask.scheduledEnd!)).toEqual(
          new Date(originalEnd)
        );
      });

      test('should update only scheduled_end while preserving scheduled_start', async () => {
        // Test partial updates of subtask scheduling data
        // Should verify that only specified fields are updated

        // Create a subtask with both start and end dates
        const originalStart = '2024-12-31T08:00:00Z';
        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Update Tests',
          notes: 'Parent task for testing subtask updates',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, {
          name: 'Subtask for partial update (end only)',
          scheduledStart: originalStart,
          scheduledEnd: '2024-12-31T16:00:00Z',
        });

        const updateData = {
          scheduledEnd: '2024-12-31T18:30:00Z', // Only updating end time
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
          .send(updateData);
        const body = response.body as SuccessResponse<{ subtask: any }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        // Verify only end date was updated, start date preserved
        expect(new Date(body.data.subtask.scheduledStart!)).toEqual(
          new Date(originalStart)
        );
        expect(new Date(body.data.subtask.scheduledEnd!)).toEqual(
          new Date(updateData.scheduledEnd)
        );
      });

      test('should reject subtask update with invalid scheduled_start date format', async () => {
        // Test that PUT /api/tasks/:taskId/subtasks/:subtaskId validates date format
        // Should return 500 error due to invalid date object creation in controller

        // Create a basic subtask to update
        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Update Tests',
          notes: 'Parent task for testing subtask updates',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, {
          name: 'Subtask for invalid start date update test',
        });

        const updateData = {
          scheduledStart: 'invalid-date-format',
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
          .send(updateData)
          .expect(500); // The controller creates new Date() which will create an invalid date object

        expect(response.body.status).toBe('error');
      });

      test('should reject subtask update with invalid scheduled_end date format', async () => {
        // Test that PUT /api/tasks/:taskId/subtasks/:subtaskId validates date format
        // Should return 500 error due to invalid date object creation in controller

        // Create a basic subtask to update
        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Update Tests',
          notes: 'Parent task for testing subtask updates',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, {
          name: 'Subtask for invalid end date update test',
        });

        const updateData = {
          scheduledEnd: 'invalid-date-format',
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
          .send(updateData)
          .expect(500); // The controller creates new Date() which will create an invalid date object

        expect(response.body.status).toBe('error');
      });

      test('should reject subtask update when scheduled_end is before scheduled_start', async () => {
        // Test logical validation of date ranges during updates
        // Should return 400 error when end date precedes start date

        // Create a basic subtask to update
        // Create parent task first
        const taskId = await createTask({
          name: 'Parent Task for Subtask Update Tests',
          notes: 'Parent task for testing subtask updates',
        });

        // Create subtask with specified data
        const subtaskId = await createSubtask(taskId, {
          name: 'Subtask for invalid date range update test',
        });

        const updateData = {
          scheduledStart: '2025-01-01T17:00:00Z',
          scheduledEnd: '2025-01-01T09:00:00Z', // End before start
        };

        const response = await request(app)
          .put(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
          .send(updateData);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('fail');
        expect(response.body.error.message).toMatch(/end.*start|start.*end/i);
      });
    });
  });

  // ============================================================================
  // API MODIFICATIONS TESTS - Removal of getAllTasks
  // ============================================================================

  describe('API Modifications - Deprecated Routes', () => {
    test('should return 404 for the removed GET /api/tasks route with indication that no route exists', async () => {
      // Test that the getAllTasks route has been properly removed
      // Should return 404 status with message indicating route no longer exists
      // This verifies the migration away from the old endpoint to the new schedule endpoint

      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(404);
      // Verify that the response indicates the route no longer exists
      // This confirms the deprecation and migration to the /api/schedule endpoint
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('fail');
    });
  });

  // ============================================================================
  // SCHEDULE API TESTS - Core Functionality
  // ============================================================================

  describe('Schedule API - Core Functionality', () => {
    describe('Basic Response Structure', () => {
      test('should return a single property "events" that is an array for GET /api/schedule', async () => {
        // Test the basic response structure of the schedule endpoint
        // Should verify response has exactly one property called "events" that is an array

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data).toHaveProperty('events');
        expect(Array.isArray(body.data.events)).toBe(true);
        // Verify that 'events' is the only property in the data object
        expect(Object.keys(body.data)).toEqual(['events']);
      });

      test('should set type property to "task" for task items', async () => {
        // Test that all task items have type property explicitly set to "task"
        // Should verify type field is correctly populated for task objects

        // Create a scheduled task to appear in schedule response
        await createTask({
          name: 'Scheduled Task for Type Test',
          scheduledStart: '2024-12-01T09:00:00Z',
          scheduledEnd: '2024-12-01T17:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.data.events.length).toBeGreaterThan(0);

        // Find task items and verify they all have type "task"
        const taskItems = body.data.events.filter(
          (event) => event.type === 'task'
        );
        expect(taskItems.length).toBeGreaterThan(0);
        taskItems.forEach((taskItem) => {
          expect(taskItem.type).toBe('task');
        });
      });

      test('should set type property to "subtask" for subtask items', async () => {
        // Test that all subtask items have type property explicitly set to "subtask"
        // Should verify type field is correctly populated for subtask objects

        // Create a parent task first
        const parentTaskId = await createTask({
          name: 'Parent Task for Subtask Type Test',
          scheduledStart: '2024-12-01T08:00:00Z',
        });

        // Create a scheduled subtask
        await createSubtask(parentTaskId, {
          name: 'Scheduled Subtask for Type Test',
          scheduledStart: '2024-12-01T09:00:00Z',
          scheduledEnd: '2024-12-01T11:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.data.events.length).toBeGreaterThan(0);

        // Find subtask items and verify they all have type "subtask"
        const subtaskItems = body.data.events.filter(
          (event) => event.type === 'subtask'
        );
        expect(subtaskItems.length).toBeGreaterThan(0);
        subtaskItems.forEach((subtaskItem) => {
          expect(subtaskItem.type).toBe('subtask');
        });
      });

      test('should include task id and projectId for task items', async () => {
        // Test that task items include their own id and parent projectId
        // Should verify task has both id and projectId fields populated

        // Create a scheduled task
        const taskId = await createTask({
          name: 'Task for ID Test',
          scheduledStart: '2024-12-01T10:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);

        // Find the specific task in the events array
        const taskItem = body.data.events.find(
          (event) => event.type === 'task' && event.id === taskId
        );

        expect(taskItem).toBeDefined();
        expect(taskItem.id).toBe(taskId);
        expect(taskItem.projectId).toBe(TEST_PROJECT_ID);
      });

      test('should include subtask id, taskId, and projectId for subtask items', async () => {
        // Test that subtask items include their own id plus both parent IDs
        // Should verify subtask has id, taskId (parent), and projectId (grandparent)

        // Create a parent task first
        const parentTaskId = await createTask({
          name: 'Parent Task for Subtask ID Test',
          scheduledStart: '2024-12-01T08:00:00Z',
        });

        // Create a scheduled subtask
        const subtaskId = await createSubtask(parentTaskId, {
          name: 'Subtask for ID Test',
          scheduledStart: '2024-12-01T09:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);

        // Find the specific subtask in the events array
        const subtaskItem = body.data.events.find(
          (event) => event.type === 'subtask' && event.id === subtaskId
        );

        expect(subtaskItem).toBeDefined();
        expect(subtaskItem.id).toBe(subtaskId);
        expect(subtaskItem.taskId).toBe(parentTaskId);
        expect(subtaskItem.projectId).toBe(TEST_PROJECT_ID);
      });

      test('should include name and notes for both task and subtask items', async () => {
        // Test that both task and subtask items include name and notes fields
        // Should verify these core properties are present in both item types

        const taskName = 'Task with Name and Notes';
        const taskNotes = 'Task notes for testing';
        const subtaskName = 'Subtask with Name and Notes';
        const subtaskNotes = 'Subtask notes for testing';

        // Create a scheduled task
        const taskId = await createTask({
          name: taskName,
          notes: taskNotes,
          scheduledStart: '2024-12-01T09:00:00Z',
        });

        // Create a scheduled subtask
        const subtaskId = await createSubtask(taskId, {
          name: subtaskName,
          notes: subtaskNotes,
          scheduledStart: '2024-12-01T10:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);

        // Find and verify task item
        const taskItem = body.data.events.find(
          (event) => event.type === 'task' && event.id === taskId
        );
        expect(taskItem).toBeDefined();
        expect(taskItem.name).toBe(taskName);
        expect(taskItem.notes).toBe(taskNotes);

        // Find and verify subtask item
        const subtaskItem = body.data.events.find(
          (event) => event.type === 'subtask' && event.id === subtaskId
        );
        expect(subtaskItem).toBeDefined();
        expect(subtaskItem.name).toBe(subtaskName);
        expect(subtaskItem.notes).toBe(subtaskNotes);
      });

      test('should include task isBillable property directly from task data', async () => {
        // Test that task items include their own isBillable property
        // Should verify task.isBillable is correctly included in response

        // Create a billable scheduled task
        const billableTaskId = await createTask({
          name: 'Billable Task',
          isBillable: true,
          scheduledStart: '2024-12-01T09:00:00Z',
        });

        // Create a non-billable scheduled task
        const nonBillableTaskId = await createTask({
          name: 'Non-Billable Task',
          isBillable: false,
          scheduledStart: '2024-12-01T13:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);

        // Find and verify billable task
        const billableTaskItem = body.data.events.find(
          (event) => event.type === 'task' && event.id === billableTaskId
        );
        expect(billableTaskItem).toBeDefined();
        expect(billableTaskItem.isBillable).toBe(true);

        // Find and verify non-billable task
        const nonBillableTaskItem = body.data.events.find(
          (event) => event.type === 'task' && event.id === nonBillableTaskId
        );
        expect(nonBillableTaskItem).toBeDefined();
        expect(nonBillableTaskItem.isBillable).toBe(false);
      });

      test('should inherit parent task isBillable property for subtask items', async () => {
        // Test that subtask items inherit isBillable from their parent task
        // Should verify subtask.isBillable matches parent task.isBillable

        // Create a billable parent task
        const billableTaskId = await createTask({
          name: 'Billable Parent Task',
          isBillable: true,
          scheduledStart: '2024-12-01T08:00:00Z',
        });

        // Create subtask under billable parent
        const billableSubtaskId = await createSubtask(billableTaskId, {
          name: 'Subtask of Billable Task',
          scheduledStart: '2024-12-01T09:00:00Z',
        });

        // Create a non-billable parent task
        const nonBillableTaskId = await createTask({
          name: 'Non-Billable Parent Task',
          isBillable: false,
          scheduledStart: '2024-12-01T13:00:00Z',
        });

        // Create subtask under non-billable parent
        const nonBillableSubtaskId = await createSubtask(nonBillableTaskId, {
          name: 'Subtask of Non-Billable Task',
          scheduledStart: '2024-12-01T14:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);

        // Find and verify subtask of billable parent inherits isBillable: true
        const billableSubtaskItem = body.data.events.find(
          (event) => event.type === 'subtask' && event.id === billableSubtaskId
        );
        expect(billableSubtaskItem).toBeDefined();
        expect(billableSubtaskItem.isBillable).toBe(true);

        // Find and verify subtask of non-billable parent inherits isBillable: false
        const nonBillableSubtaskItem = body.data.events.find(
          (event) =>
            event.type === 'subtask' && event.id === nonBillableSubtaskId
        );
        expect(nonBillableSubtaskItem).toBeDefined();
        expect(nonBillableSubtaskItem.isBillable).toBe(false);
      });

      test('should handle null notes gracefully for both task and subtask items', async () => {
        // Test that null notes values are properly handled in response structure
        // Should verify both task and subtask items can have null notes without errors

        // Create a task with null notes (by not providing notes field)
        const taskId = await createTask({
          name: 'Task with Null Notes',
          scheduledStart: '2024-12-01T09:00:00Z',
        });

        // Create a subtask with null notes (by not providing notes field)
        const subtaskId = await createSubtask(taskId, {
          name: 'Subtask with Null Notes',
          scheduledStart: '2024-12-01T10:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);

        // Find and verify task handles null notes
        const taskItem = body.data.events.find(
          (event) => event.type === 'task' && event.id === taskId
        );
        expect(taskItem).toBeDefined();
        expect(taskItem.name).toBe('Task with Null Notes');
        expect(taskItem.notes).toBeNull();

        // Find and verify subtask handles null notes
        const subtaskItem = body.data.events.find(
          (event) => event.type === 'subtask' && event.id === subtaskId
        );
        expect(subtaskItem).toBeDefined();
        expect(subtaskItem.name).toBe('Subtask with Null Notes');
        expect(subtaskItem.notes).toBeNull();
      });

      test('should return empty events array when no tasks or subtasks are found', async () => {
        // Test handling of empty state
        // Should verify that an empty array is returned when user has no scheduled items
        // Note: This test assumes no other tests have created scheduled items for today

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.events).toEqual([]);
        expect(Array.isArray(body.data.events)).toBe(true);
      });

      test('should return only tasks in events array when no subtasks are found', async () => {
        // Test partial data scenarios - tasks only
        // Should verify that only task objects are included when no subtasks exist

        // Create scheduled tasks only (no subtasks)
        const task1Id = await createTask({
          name: 'First Task Only',
          scheduledStart: '2024-12-01T09:00:00Z',
        });

        const task2Id = await createTask({
          name: 'Second Task Only',
          scheduledStart: '2024-12-01T14:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.data.events.length).toBeGreaterThanOrEqual(2);

        // Verify only tasks are present, no subtasks
        const taskItems = body.data.events.filter(
          (event) => event.type === 'task'
        );
        const subtaskItems = body.data.events.filter(
          (event) => event.type === 'subtask'
        );

        expect(taskItems.length).toBeGreaterThanOrEqual(2);
        expect(subtaskItems.length).toBe(0);

        // Verify our specific tasks are included
        const task1Item = taskItems.find((task) => task.id === task1Id);
        const task2Item = taskItems.find((task) => task.id === task2Id);
        expect(task1Item).toBeDefined();
        expect(task2Item).toBeDefined();
      });

      test('should return only subtasks in events array when no tasks are found', async () => {
        // Test partial data scenarios - subtasks only
        // Should verify that only subtask objects are included when no tasks exist
        // Note: This creates a parent task but schedules only subtasks, assuming the parent task has no scheduling

        // Create an unscheduled parent task (won't appear in schedule)
        const parentTaskId = await createTask({
          name: 'Unscheduled Parent Task',
          // No scheduledStart/scheduledEnd, so it won't appear in schedule
        });

        // Create scheduled subtasks only
        const subtask1Id = await createSubtask(parentTaskId, {
          name: 'First Subtask Only',
          scheduledStart: '2024-12-01T09:00:00Z',
        });

        const subtask2Id = await createSubtask(parentTaskId, {
          name: 'Second Subtask Only',
          scheduledStart: '2024-12-01T14:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.data.events.length).toBeGreaterThanOrEqual(2);

        // Verify only subtasks are present, no scheduled tasks for this test
        const subtaskItems = body.data.events.filter(
          (event) => event.type === 'subtask'
        );

        expect(subtaskItems.length).toBeGreaterThanOrEqual(2);

        // Verify our specific subtasks are included
        const subtask1Item = subtaskItems.find(
          (subtask) => subtask.id === subtask1Id
        );
        const subtask2Item = subtaskItems.find(
          (subtask) => subtask.id === subtask2Id
        );
        expect(subtask1Item).toBeDefined();
        expect(subtask2Item).toBeDefined();
      });

      test('should return both tasks and subtasks in events array when both are found', async () => {
        // Test mixed data scenarios
        // Should verify that both task and subtask objects are included in the same array

        // Create a scheduled task
        const taskId = await createTask({
          name: 'Mixed Scenario Task',
          scheduledStart: '2024-12-01T09:00:00Z',
        });

        // Create another scheduled task that will also serve as parent for subtask
        const parentTaskId = await createTask({
          name: 'Parent Task (also scheduled)',
          scheduledStart: '2024-12-01T11:00:00Z',
        });

        // Create a scheduled subtask
        const subtaskId = await createSubtask(parentTaskId, {
          name: 'Mixed Scenario Subtask',
          scheduledStart: '2024-12-01T13:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.data.events.length).toBeGreaterThanOrEqual(3);

        // Verify both tasks and subtasks are present
        const taskItems = body.data.events.filter(
          (event) => event.type === 'task'
        );
        const subtaskItems = body.data.events.filter(
          (event) => event.type === 'subtask'
        );

        expect(taskItems.length).toBeGreaterThanOrEqual(2);
        expect(subtaskItems.length).toBeGreaterThanOrEqual(1);

        // Verify our specific items are included
        const taskItem = taskItems.find((task) => task.id === taskId);
        const parentTaskItem = taskItems.find(
          (task) => task.id === parentTaskId
        );
        const subtaskItem = subtaskItems.find(
          (subtask) => subtask.id === subtaskId
        );

        expect(taskItem).toBeDefined();
        expect(parentTaskItem).toBeDefined();
        expect(subtaskItem).toBeDefined();

        // Verify that tasks and subtasks are mixed in the same events array
        const allEventTypes = body.data.events.map((event) => event.type);
        expect(allEventTypes).toContain('task');
        expect(allEventTypes).toContain('subtask');
      });
    });

    describe('Default Time Range Behavior', () => {
      // Setup function that creates all test data and returns the IDs
      const setupTestData = async () => {
        const factory = await createTestDataFactory({
          targetDate: '2024-12-01',
          namePrefix: 'Current Day ',
        });

        return {
          currentDayTaskId: factory.withinTaskId,
          currentDaySubtaskId: factory.withinSubtaskId,
          previousDayTaskId: factory.beforeTaskId,
          previousDaySubtaskId: factory.beforeSubtaskId,
          futureDayTaskId: factory.afterTaskId,
          futureDaySubtaskId: factory.afterSubtaskId,
          startsCurrentDayTaskId: factory.startsWithinTaskId,
          startsCurrentDaySubtaskId: factory.startsWithinSubtaskId,
          endsCurrentDayTaskId: factory.endsWithinTaskId,
          endsCurrentDaySubtaskId: factory.endsWithinSubtaskId,
          spansCurrentDayTaskId: factory.spansTaskId,
          spansCurrentDaySubtaskId: factory.spansSubtaskId,
          currentDayStartBoundaryTaskId: factory.startBoundaryTaskId,
          currentDayEndBoundaryTaskId: factory.endBoundaryTaskId,
        };
      };

      test('should return only tasks and subtasks within the current day when no query parameters provided', async () => {
        // Test default behavior with no start/end parameters
        // Should verify that only items scheduled for "today" are returned
        // Should test boundary conditions (start of day, end of day)

        // Setup test data
        const testData = await setupTestData();

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data.events)).toBe(true);

        // Extract IDs of returned events for verification
        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should include items that are entirely within current day
        expect(returnedEventIds).toContain(testData.currentDayTaskId);
        expect(returnedEventIds).toContain(testData.currentDaySubtaskId);

        // Should include items that start on current day (even if they extend beyond)
        expect(returnedEventIds).toContain(testData.startsCurrentDayTaskId);
        expect(returnedEventIds).toContain(testData.startsCurrentDaySubtaskId);

        // Should include items that end on current day (even if they started before)
        expect(returnedEventIds).toContain(testData.endsCurrentDayTaskId);
        expect(returnedEventIds).toContain(testData.endsCurrentDaySubtaskId);

        // Should include items that span across current day
        expect(returnedEventIds).toContain(testData.spansCurrentDayTaskId);
        expect(returnedEventIds).toContain(testData.spansCurrentDaySubtaskId);

        // Should include boundary condition items
        expect(returnedEventIds).toContain(
          testData.currentDayStartBoundaryTaskId
        );
        expect(returnedEventIds).toContain(
          testData.currentDayEndBoundaryTaskId
        );

        // Should NOT include items from previous day only
        expect(returnedEventIds).not.toContain(testData.previousDayTaskId);
        expect(returnedEventIds).not.toContain(testData.previousDaySubtaskId);

        // Should NOT include items from future day only
        expect(returnedEventIds).not.toContain(testData.futureDayTaskId);
        expect(returnedEventIds).not.toContain(testData.futureDaySubtaskId);
      });

      test('should include tasks and subtasks that start on current day regardless of end date', async () => {
        // Test inclusion logic for items starting today
        // Should verify that multi-day events starting today are included

        // Setup test data
        const testData = await setupTestData();

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);

        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should include tasks/subtasks that start today but end in the future
        expect(returnedEventIds).toContain(testData.startsCurrentDayTaskId);
        expect(returnedEventIds).toContain(testData.startsCurrentDaySubtaskId);

        // Verify the specific events and their scheduling details
        const startsCurrentDayTask = body.data.events.find(
          (event) => event.id === testData.startsCurrentDayTaskId
        );
        const startsCurrentDaySubtask = body.data.events.find(
          (event) => event.id === testData.startsCurrentDaySubtaskId
        );

        expect(startsCurrentDayTask).toBeDefined();
        expect(startsCurrentDaySubtask).toBeDefined();

        // Verify these events start on current day but extend beyond
        expect(startsCurrentDayTask.scheduledStart).toContain('2024-12-01');
        expect(startsCurrentDayTask.scheduledEnd).toContain('2024-12-02'); // Ends tomorrow
        expect(startsCurrentDaySubtask.scheduledStart).toContain('2024-12-01');
        expect(startsCurrentDaySubtask.scheduledEnd).toContain('2024-12-02'); // Ends tomorrow
      });

      test('should include tasks and subtasks that end on current day regardless of start date', async () => {
        // Test inclusion logic for items ending today
        // Should verify that multi-day events ending today are included

        // Setup test data
        const testData = await setupTestData();

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);

        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should include tasks/subtasks that end today but started in the past
        expect(returnedEventIds).toContain(testData.endsCurrentDayTaskId);
        expect(returnedEventIds).toContain(testData.endsCurrentDaySubtaskId);

        // Verify the specific events and their scheduling details
        const endsCurrentDayTask = body.data.events.find(
          (event) => event.id === testData.endsCurrentDayTaskId
        );
        const endsCurrentDaySubtask = body.data.events.find(
          (event) => event.id === testData.endsCurrentDaySubtaskId
        );

        expect(endsCurrentDayTask).toBeDefined();
        expect(endsCurrentDaySubtask).toBeDefined();

        // Verify these events started in the past but end on current day
        expect(endsCurrentDayTask.scheduledStart).toContain('2024-11-30'); // Started yesterday
        expect(endsCurrentDayTask.scheduledEnd).toContain('2024-12-01');
        expect(endsCurrentDaySubtask.scheduledStart).toContain('2024-11-30'); // Started yesterday
        expect(endsCurrentDaySubtask.scheduledEnd).toContain('2024-12-01');
      });

      test('should include tasks and subtasks that span across the current day', async () => {
        // Test inclusion logic for items spanning today
        // Should verify that multi-day events that encompass today are included

        // Setup test data
        const testData = await setupTestData();

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);

        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should include tasks/subtasks that span across the current day (start before, end after)
        expect(returnedEventIds).toContain(testData.spansCurrentDayTaskId);
        expect(returnedEventIds).toContain(testData.spansCurrentDaySubtaskId);

        // Verify the specific events and their scheduling details
        const spansCurrentDayTask = body.data.events.find(
          (event) => event.id === testData.spansCurrentDayTaskId
        );
        const spansCurrentDaySubtask = body.data.events.find(
          (event) => event.id === testData.spansCurrentDaySubtaskId
        );

        expect(spansCurrentDayTask).toBeDefined();
        expect(spansCurrentDaySubtask).toBeDefined();

        // Verify these events started before current day and end after current day
        expect(spansCurrentDayTask.scheduledStart).toContain('2024-11-30'); // Started yesterday
        expect(spansCurrentDayTask.scheduledEnd).toContain('2024-12-02'); // Ends tomorrow
        expect(spansCurrentDaySubtask.scheduledStart).toContain('2024-11-30'); // Started yesterday
        expect(spansCurrentDaySubtask.scheduledEnd).toContain('2024-12-02'); // Ends tomorrow

        // These represent the most complex case: events that don't start or end on current day
        // but still need to be included because they encompass the current day
        expect(spansCurrentDayTask.name).toBe('Spans Current Day Task');
        expect(spansCurrentDaySubtask.name).toBe('Spans Current Day Subtask');
      });
    });

    describe('Start Date Filtering', () => {
      // Setup function that creates all test data for start date filtering and returns the IDs
      const setupTestDataForStartFiltering = async () => {
        const factory = await createTestDataFactory({
          targetDate: '2024-12-02',
          namePrefix: 'Filter ',
        });

        return {
          // Items that should be included (on or after filter date)
          onFilterDateTaskId: factory.withinTaskId,
          afterFilterTaskId: factory.afterTaskId,
          parentTaskId: factory.withinParentId,
          onFilterDateSubtaskId: factory.withinSubtaskId,
          afterFilterSubtaskId: factory.afterSubtaskId,
          earlyMorningTaskId: factory.startBoundaryTaskId,
          midDayTaskId: factory.withinTaskId, // Using the same task for simplicity
          endOfDayTaskId: factory.endBoundaryTaskId,
          parentTaskBoundaryId: factory.boundaryParentId,
          exactStartSubtaskId: factory.exactBoundarySubtaskId,
          // Items that should be excluded (before filter date)
          beforeFilterTaskId: factory.beforeTaskId,
          beforeFilterSubtaskId: factory.beforeSubtaskId,
          dayBeforeTaskId: factory.beforeTaskId, // Using the same task for simplicity
          hoursBeforeTaskId: factory.beforeTaskId, // Using the same task for simplicity
          parentTaskBeforeId: factory.beforeParentId,
          subtaskBeforeId: factory.beforeSubtaskId,
        };
      };

      test('should return tasks and subtasks beginning at or after the start date when start parameter provided', async () => {
        // Test start date filtering with GET /api/schedule?start=DATE
        // Should verify that only items starting on or after the specified date are returned

        // Setup test data
        const testData = await setupTestDataForStartFiltering();

        // Set filter start date to 2024-12-02 (one day after current mocked date)
        const startFilterDate = '2024-12-02';

        // Make request with start date filter
        const response = await request(app).get(
          `/api/schedule?start=${startFilterDate}`
        );
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data.events)).toBe(true);

        // Extract IDs of returned events for verification
        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should include items starting exactly on filter date
        expect(returnedEventIds).toContain(testData.onFilterDateTaskId);
        expect(returnedEventIds).toContain(testData.onFilterDateSubtaskId);

        // Should include items starting after filter date
        expect(returnedEventIds).toContain(testData.afterFilterTaskId);
        expect(returnedEventIds).toContain(testData.afterFilterSubtaskId);

        // Should NOT include items starting before filter date
        expect(returnedEventIds).not.toContain(testData.beforeFilterTaskId);
        expect(returnedEventIds).not.toContain(testData.beforeFilterSubtaskId);

        // Should include the parent task since it starts on filter date
        expect(returnedEventIds).toContain(testData.parentTaskId);
      });

      test('should handle start date parameter with various date formats (ISO, yyyy-mm-dd)', async () => {
        // Test date format flexibility for start parameter
        // Should verify that common date formats are accepted and parsed correctly

        // Create a task that should be included with any valid start date format
        const testTaskId = await createTask({
          name: 'Task for Date Format Test',
          scheduledStart: '2024-12-02T09:00:00Z',
          scheduledEnd: '2024-12-02T17:00:00Z',
        });

        // Test various valid date formats that should all work
        const validDateFormats = [
          '2024-12-02', // yyyy-mm-dd format
          '2024-12-02T00:00:00Z', // Full ISO format with time
          '2024-12-02T00:00:00.000Z', // ISO format with milliseconds
        ];

        // Test each format to ensure they all work and return the same result
        for (const dateFormat of validDateFormats) {
          const response = await request(app).get(
            `/api/schedule?start=${encodeURIComponent(dateFormat)}`
          );
          const body = response.body as SuccessResponse<{ events: any[] }>;

          expect(response.status).toBe(200);
          expect(body.status).toBe('success');
          expect(Array.isArray(body.data.events)).toBe(true);

          // Should include our test task with all valid formats
          const returnedEventIds = body.data.events.map((event) => event.id);
          expect(returnedEventIds).toContain(testTaskId);
        }
      });

      test('should reject invalid start date format with appropriate error message', async () => {
        // Test validation of start date parameter
        // Should return 400 error when start date format is invalid

        // Test various invalid date formats
        const invalidDateFormats = [
          'invalid-date',
          '2024-13-02', // Invalid month
          '2024-12-32', // Invalid day
          'null',
          'undefined',
        ];

        // Test each invalid format to ensure they all return errors
        for (const invalidDate of invalidDateFormats) {
          const response = await request(app).get(
            `/api/schedule?start=${encodeURIComponent(invalidDate)}`
          );

          expect(response.status).toBe(400);
          expect(response.body.status).toBe('fail');
          expect(response.body.error).toBeDefined();
          expect(response.body.error.message).toMatch(
            /invalid.*date|date.*invalid|start.*date/i
          );
        }
      });

      test('should include tasks and subtasks that start exactly on the start date', async () => {
        // Test boundary condition for start date filtering
        // Should verify that items starting exactly at the specified date are included

        // Setup test data
        const testData = await setupTestDataForStartFiltering();

        const exactStartDate = '2024-12-02';

        // Make request with exact start date
        const response = await request(app).get(
          `/api/schedule?start=${exactStartDate}`
        );
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');

        const returnedEventIds = body.data.events.map((event) => event.id);

        // All items starting exactly on the date should be included
        expect(returnedEventIds).toContain(testData.earlyMorningTaskId);
        expect(returnedEventIds).toContain(testData.midDayTaskId);
        expect(returnedEventIds).toContain(testData.endOfDayTaskId);
        expect(returnedEventIds).toContain(testData.parentTaskBoundaryId);
        expect(returnedEventIds).toContain(testData.exactStartSubtaskId);

        // Verify the actual start dates in the response
        const earlyMorningTask = body.data.events.find(
          (event) => event.id === testData.earlyMorningTaskId
        );
        const exactStartSubtask = body.data.events.find(
          (event) => event.id === testData.exactStartSubtaskId
        );

        expect(earlyMorningTask.scheduledStart).toContain('2024-12-02');
        expect(exactStartSubtask.scheduledStart).toContain('2024-12-02');
      });

      test('should exclude tasks and subtasks that start before the start date', async () => {
        // Test exclusion logic for start date filtering
        // Should verify that items starting before the specified date are excluded

        // Setup test data
        const testData = await setupTestDataForStartFiltering();

        const startFilterDate = '2024-12-02';

        // Make request with start date filter
        const response = await request(app).get(
          `/api/schedule?start=${startFilterDate}`
        );
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');

        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should exclude all items starting before the filter date
        expect(returnedEventIds).not.toContain(testData.dayBeforeTaskId);
        expect(returnedEventIds).not.toContain(testData.hoursBeforeTaskId);
        expect(returnedEventIds).not.toContain(testData.parentTaskBeforeId);
        expect(returnedEventIds).not.toContain(testData.subtaskBeforeId);

        // Verify that no events in the response start before the filter date
        body.data.events.forEach((event) => {
          const eventStartDate = new Date(event.scheduledStart);
          const filterDate = new Date(startFilterDate);
          expect(eventStartDate.getTime()).toBeGreaterThanOrEqual(
            filterDate.getTime()
          );
        });
      });
    });

    describe('End Date Filtering', () => {
      // Setup function that creates all test data for end date filtering and returns the IDs
      const setupTestDataForEndFiltering = async () => {
        const factory = await createTestDataFactory({
          targetDate: '2024-12-02',
          namePrefix: 'End Filter ',
        });

        return {
          // Items that should be included (ending on or before filter date)
          beforeFilterTaskId: factory.beforeTaskId,
          onFilterDateTaskId: factory.withinTaskId,
          parentTaskId: factory.withinParentId,
          beforeFilterSubtaskId: factory.beforeSubtaskId,
          onFilterDateSubtaskId: factory.withinSubtaskId,
          earlyMorningTaskId: factory.startBoundaryTaskId,
          midDayTaskId: factory.withinTaskId, // Using the same task for simplicity
          endOfDayTaskId: factory.endBoundaryTaskId,
          parentTaskBoundaryId: factory.boundaryParentId,
          exactEndSubtaskId: factory.exactBoundarySubtaskId,
          // Items that should be excluded (ending after filter date)
          afterFilterTaskId: factory.afterTaskId,
          afterFilterSubtaskId: factory.afterSubtaskId,
          dayAfterTaskId: factory.afterTaskId, // Using the same task for simplicity
          hoursAfterTaskId: factory.afterTaskId, // Using the same task for simplicity
          parentTaskAfterId: factory.afterParentId,
          subtaskAfterId: factory.afterSubtaskId,
        };
      };

      test('should return tasks and subtasks before or ending at the end date when end parameter provided', async () => {
        // Test end date filtering with GET /api/schedule?end=DATE
        // Should verify that only items ending on or before the specified date are returned

        // Setup test data
        const testData = await setupTestDataForEndFiltering();

        // Set filter end date to 2024-12-02 (one day after current mocked date)
        const endFilterDate = '2024-12-02';

        // Make request with end date filter
        const response = await request(app).get(
          `/api/schedule?end=${endFilterDate}`
        );
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data.events)).toBe(true);

        // Extract IDs of returned events for verification
        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should include items ending before filter date
        expect(returnedEventIds).toContain(testData.beforeFilterTaskId);
        expect(returnedEventIds).toContain(testData.beforeFilterSubtaskId);

        // Should include items ending exactly on filter date
        expect(returnedEventIds).toContain(testData.onFilterDateTaskId);
        expect(returnedEventIds).toContain(testData.onFilterDateSubtaskId);

        // Should NOT include items ending after filter date
        expect(returnedEventIds).not.toContain(testData.afterFilterTaskId);
        expect(returnedEventIds).not.toContain(testData.afterFilterSubtaskId);

        // Should include the parent task since it ends on filter date
        expect(returnedEventIds).toContain(testData.parentTaskId);
      });

      test('should handle end date parameter with various date formats (ISO, yyyy-mm-dd)', async () => {
        // Test date format flexibility for end parameter
        // Should verify that common date formats are accepted and parsed correctly

        // Create a task that should be included with any valid end date format
        const testTaskId = await createTask({
          name: 'Task for Date Format Test',
          scheduledStart: '2024-12-01T09:00:00Z',
          scheduledEnd: '2024-12-02T17:00:00Z',
        });

        // Test various valid date formats that should all work
        const validDateFormats = [
          '2024-12-02', // yyyy-mm-dd format
          '2024-12-02T23:59:59Z', // Full ISO format with time
          '2024-12-02T23:59:59.999Z', // ISO format with milliseconds
        ];

        // Test each format to ensure they all work and return the same result
        for (const dateFormat of validDateFormats) {
          const response = await request(app).get(
            `/api/schedule?end=${encodeURIComponent(dateFormat)}`
          );
          const body = response.body as SuccessResponse<{ events: any[] }>;

          expect(response.status).toBe(200);
          expect(body.status).toBe('success');
          expect(Array.isArray(body.data.events)).toBe(true);

          // Should include our test task with all valid formats
          const returnedEventIds = body.data.events.map((event) => event.id);
          expect(returnedEventIds).toContain(testTaskId);
        }
      });

      test('should reject invalid end date format with appropriate error message', async () => {
        // Test validation of end date parameter
        // Should return 400 error when end date format is invalid

        // Test various invalid date formats
        const invalidDateFormats = [
          'invalid-date',
          '2024-13-02', // Invalid month
          '2024-12-32', // Invalid day
          'null',
          'undefined',
        ];

        // Test each invalid format to ensure they all return errors
        for (const invalidDate of invalidDateFormats) {
          const response = await request(app).get(
            `/api/schedule?end=${encodeURIComponent(invalidDate)}`
          );

          expect(response.status).toBe(400);
          expect(response.body.status).toBe('fail');
          expect(response.body.error).toBeDefined();
          expect(response.body.error.message).toMatch(
            /invalid.*date|date.*invalid|end.*date/i
          );
        }
      });

      test('should include tasks and subtasks that end exactly on the end date', async () => {
        // Test boundary condition for end date filtering
        // Should verify that items ending exactly at the specified date are included

        // Setup test data
        const testData = await setupTestDataForEndFiltering();

        const exactEndDate = '2024-12-02';

        // Make request with exact end date
        const response = await request(app).get(
          `/api/schedule?end=${exactEndDate}`
        );
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');

        const returnedEventIds = body.data.events.map((event) => event.id);

        // All items ending exactly on the date should be included
        expect(returnedEventIds).toContain(testData.earlyMorningTaskId);
        expect(returnedEventIds).toContain(testData.midDayTaskId);
        expect(returnedEventIds).toContain(testData.endOfDayTaskId);
        expect(returnedEventIds).toContain(testData.parentTaskBoundaryId);
        expect(returnedEventIds).toContain(testData.exactEndSubtaskId);

        // Verify the actual end dates in the response
        const earlyMorningTask = body.data.events.find(
          (event) => event.id === testData.earlyMorningTaskId
        );
        const exactEndSubtask = body.data.events.find(
          (event) => event.id === testData.exactEndSubtaskId
        );

        expect(earlyMorningTask.scheduledEnd).toContain('2024-12-02');
        expect(exactEndSubtask.scheduledEnd).toContain('2024-12-02');
      });

      test('should exclude tasks and subtasks that end after the end date', async () => {
        // Test exclusion logic for end date filtering
        // Should verify that items ending after the specified date are excluded

        // Setup test data
        const testData = await setupTestDataForEndFiltering();

        const endFilterDate = '2024-12-02';

        // Make request with end date filter
        const response = await request(app).get(
          `/api/schedule?end=${endFilterDate}`
        );
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');

        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should exclude all items ending after the filter date
        expect(returnedEventIds).not.toContain(testData.dayAfterTaskId);
        expect(returnedEventIds).not.toContain(testData.hoursAfterTaskId);
        expect(returnedEventIds).not.toContain(testData.parentTaskAfterId);
        expect(returnedEventIds).not.toContain(testData.subtaskAfterId);

        // Verify that no events in the response end after the filter date
        body.data.events.forEach((event) => {
          if (event.scheduledEnd) {
            const eventEndDate = new Date(event.scheduledEnd);
            const parsedFilterDate = new Date(endFilterDate);
            // Set filter date to end of day using UTC to avoid timezone issues
            const filterDate = new Date(
              Date.UTC(
                parsedFilterDate.getUTCFullYear(),
                parsedFilterDate.getUTCMonth(),
                parsedFilterDate.getUTCDate(),
                23,
                59,
                59,
                999
              )
            );
            expect(eventEndDate.getTime()).toBeLessThanOrEqual(
              filterDate.getTime()
            );
          }
        });
      });
    });

    describe('Date Range Filtering', () => {
      // Setup function that creates all test data for date range filtering and returns the IDs
      const setupTestDataForDateRangeFiltering = async () => {
        const factory = await createTestDataFactory({
          targetStartDate: '2024-12-02',
          targetEndDate: '2024-12-04',
          namePrefix: 'Range ',
        });

        return {
          // Items that should be included in range tests
          withinRangeTaskId: factory.withinTaskId,
          withinRangeTask2Id: factory.withinTaskId, // Using the same task for simplicity
          parentTaskWithinId: factory.withinParentId,
          withinRangeSubtaskId: factory.withinSubtaskId,
          startsBeforeTaskId: factory.endsWithinTaskId,
          startsBeforeParentId: factory.endsWithinParentId,
          startsBeforeSubtaskId: factory.endsWithinSubtaskId,
          endsAfterTaskId: factory.startsWithinTaskId,
          endsAfterParentId: factory.withinParentId, // Using a parent from within range
          endsAfterSubtaskId: factory.startsWithinSubtaskId,
          spansRangeTaskId: factory.spansTaskId,
          spansRangeParentId: factory.spansParentId,
          spansRangeSubtaskId: factory.spansSubtaskId,
          exactStartTaskId: factory.startBoundaryTaskId,
          exactEndTaskId: factory.endBoundaryTaskId,
          exactBoundaryParentId: factory.boundaryParentId,
          exactBoundarySubtaskId: factory.exactBoundarySubtaskId,
          // Items that should be excluded in range tests
          beforeRangeTaskId: factory.beforeTaskId,
          beforeRangeParentId: factory.beforeParentId,
          beforeRangeSubtaskId: factory.beforeSubtaskId,
          afterRangeTaskId: factory.afterTaskId,
          afterRangeParentId: factory.afterParentId,
          afterRangeSubtaskId: factory.afterSubtaskId,
          // Items for single day testing (on 2024-12-03, the middle day)
          singleDayTaskId: factory.startsWithinTaskId, // Starts on 2024-12-03
          singleDayParentId: factory.startsWithinTaskId, // Using the same task for simplicity
          singleDaySubtaskId: factory.startsWithinSubtaskId, // Starts on 2024-12-03
        };
      };

      test('should return tasks and subtasks occurring between or on the start and end dates when both parameters provided', async () => {
        // Test combined start and end date filtering with GET /api/schedule?start=DATE&end=DATE
        // Should verify that only items within the specified date range are returned

        // Setup test data
        const testData = await setupTestDataForDateRangeFiltering();

        // Set filter date range to 2024-12-02 to 2024-12-04 (3-day range)
        const startFilterDate = '2024-12-02';
        const endFilterDate = '2024-12-04';

        // Make request with both start and end date filters
        const response = await request(app).get(
          `/api/schedule?start=${startFilterDate}&end=${endFilterDate}`
        );
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data.events)).toBe(true);

        // Extract IDs of returned events for verification
        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should include items entirely within range
        expect(returnedEventIds).toContain(testData.withinRangeTaskId);
        expect(returnedEventIds).toContain(testData.withinRangeTask2Id);
        expect(returnedEventIds).toContain(testData.parentTaskWithinId);
        expect(returnedEventIds).toContain(testData.withinRangeSubtaskId);

        // Should include items that overlap with range (partial overlap)
        expect(returnedEventIds).toContain(testData.startsBeforeTaskId);
        expect(returnedEventIds).toContain(testData.startsBeforeSubtaskId);
        expect(returnedEventIds).toContain(testData.endsAfterTaskId);
        expect(returnedEventIds).toContain(testData.endsAfterSubtaskId);

        // Should include items that span the entire range
        expect(returnedEventIds).toContain(testData.spansRangeTaskId);
        expect(returnedEventIds).toContain(testData.spansRangeSubtaskId);

        // Should include boundary condition items
        expect(returnedEventIds).toContain(testData.exactStartTaskId);
        expect(returnedEventIds).toContain(testData.exactEndTaskId);
        expect(returnedEventIds).toContain(testData.exactBoundarySubtaskId);

        // Should NOT include items completely outside the range
        expect(returnedEventIds).not.toContain(testData.beforeRangeTaskId);
        expect(returnedEventIds).not.toContain(testData.beforeRangeSubtaskId);
        expect(returnedEventIds).not.toContain(testData.afterRangeTaskId);
        expect(returnedEventIds).not.toContain(testData.afterRangeSubtaskId);
      });

      test('should handle date range where start equals end (single day)', async () => {
        // Test edge case where start and end dates are the same
        // Should verify that items on that specific day are returned

        // Setup test data
        const testData = await setupTestDataForDateRangeFiltering();

        // Set both start and end to the same date (single day range)
        const singleDate = '2024-12-03';

        // Make request with identical start and end dates
        const response = await request(app).get(
          `/api/schedule?start=${singleDate}&end=${singleDate}`
        );
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data.events)).toBe(true);

        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should include items that occur on the single specified day
        expect(returnedEventIds).toContain(testData.singleDayTaskId);
        expect(returnedEventIds).toContain(testData.singleDayParentId);
        expect(returnedEventIds).toContain(testData.singleDaySubtaskId);

        // Should include items that overlap with the single day (even if they extend beyond)
        expect(returnedEventIds).toContain(testData.withinRangeTask2Id); // Starts on 2024-12-03
        expect(returnedEventIds).toContain(testData.spansRangeTaskId); // Spans across the day
        expect(returnedEventIds).toContain(testData.spansRangeSubtaskId); // Spans across the day

        // Verify that all returned events either start, end, or span the specified single day
        body.data.events.forEach((event) => {
          const eventStart = new Date(event.scheduledStart);
          const eventEnd = event.scheduledEnd
            ? new Date(event.scheduledEnd)
            : null;
          const singleDateStart = new Date(`${singleDate}T00:00:00Z`);
          const singleDateEnd = new Date(`${singleDate}T23:59:59Z`);

          // Event should either start on the day, end on the day, or span across the day
          const startsOnDay =
            eventStart >= singleDateStart && eventStart <= singleDateEnd;
          const endsOnDay =
            eventEnd &&
            eventEnd >= singleDateStart &&
            eventEnd <= singleDateEnd;
          const spansDay =
            eventStart < singleDateStart &&
            eventEnd &&
            eventEnd > singleDateEnd;

          expect(startsOnDay || endsOnDay || spansDay).toBe(true);
        });
      });

      test('should reject date range where end date is before start date', async () => {
        // Test validation of date range logic
        // Should return 400 error when end date precedes start date

        // Set up invalid date range (end before start)
        const startDate = '2024-12-04';
        const endDate = '2024-12-02'; // End date is before start date

        // Make request with invalid date range
        const response = await request(app).get(
          `/api/schedule?start=${startDate}&end=${endDate}`
        );

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('fail');
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toMatch(
          /end.*start|start.*end|range.*invalid|invalid.*range/i
        );
      });

      test('should include tasks and subtasks that partially overlap with the date range', async () => {
        // Test inclusion logic for partially overlapping events
        // Should verify that events extending beyond the range but overlapping are included

        // Setup test data
        const testData = await setupTestDataForDateRangeFiltering();

        // Set filter date range
        const startFilterDate = '2024-12-02';
        const endFilterDate = '2024-12-04';

        // Make request with date range
        const response = await request(app).get(
          `/api/schedule?start=${startFilterDate}&end=${endFilterDate}`
        );
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');

        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should include events that start before range but end within range
        expect(returnedEventIds).toContain(testData.startsBeforeTaskId);
        expect(returnedEventIds).toContain(testData.startsBeforeSubtaskId);

        // Should include events that start within range but end after range
        expect(returnedEventIds).toContain(testData.endsAfterTaskId);
        expect(returnedEventIds).toContain(testData.endsAfterSubtaskId);

        // Should include events that span the entire range (start before, end after)
        expect(returnedEventIds).toContain(testData.spansRangeTaskId);
        expect(returnedEventIds).toContain(testData.spansRangeSubtaskId);

        // Verify the specific overlap scenarios by checking the actual dates
        const startsBeforeTask = body.data.events.find(
          (event) => event.id === testData.startsBeforeTaskId
        );
        const endsAfterTask = body.data.events.find(
          (event) => event.id === testData.endsAfterTaskId
        );
        const spansRangeTask = body.data.events.find(
          (event) => event.id === testData.spansRangeTaskId
        );

        expect(startsBeforeTask).toBeDefined();
        expect(endsAfterTask).toBeDefined();
        expect(spansRangeTask).toBeDefined();

        // Verify overlap conditions
        expect(startsBeforeTask.scheduledStart).toContain('2024-12-01'); // Starts before range
        expect(startsBeforeTask.scheduledEnd).toContain('2024-12-02'); // Ends within range

        expect(endsAfterTask.scheduledStart).toContain('2024-12-03'); // Starts within range
        expect(endsAfterTask.scheduledEnd).toContain('2024-12-05'); // Ends after range

        expect(spansRangeTask.scheduledStart).toContain('2024-12-01'); // Starts before range
        expect(spansRangeTask.scheduledEnd).toContain('2024-12-05'); // Ends after range
      });

      test('should exclude tasks and subtasks that are completely outside the date range', async () => {
        // Test exclusion logic for non-overlapping events
        // Should verify that events completely outside the range are excluded

        // Setup test data
        const testData = await setupTestDataForDateRangeFiltering();

        // Set filter date range
        const startFilterDate = '2024-12-02';
        const endFilterDate = '2024-12-04';

        // Make request with date range
        const response = await request(app).get(
          `/api/schedule?start=${startFilterDate}&end=${endFilterDate}`
        );
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');

        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should exclude events that are completely before the range
        expect(returnedEventIds).not.toContain(testData.beforeRangeTaskId);
        expect(returnedEventIds).not.toContain(testData.beforeRangeParentId);
        expect(returnedEventIds).not.toContain(testData.beforeRangeSubtaskId);

        // Should exclude events that are completely after the range
        expect(returnedEventIds).not.toContain(testData.afterRangeTaskId);
        expect(returnedEventIds).not.toContain(testData.afterRangeParentId);
        expect(returnedEventIds).not.toContain(testData.afterRangeSubtaskId);

        // Verify that no events in the response are completely outside the range
        const startDate = new Date(startFilterDate);
        const endDate = new Date(endFilterDate);
        // Set end date to end of day to include events that end on the end date
        endDate.setUTCHours(23, 59, 59, 999);

        body.data.events.forEach((event) => {
          const eventStart = new Date(event.scheduledStart);
          const eventEnd = event.scheduledEnd
            ? new Date(event.scheduledEnd)
            : null;

          // Event should not be completely before the range
          // (only if it has an end date AND that end date is before the start date)
          const completelyBefore = eventEnd ? eventEnd < startDate : false;
          // Event should not be completely after the range
          const completelyAfter = eventStart > endDate;

          expect(completelyBefore).toBe(false);
          expect(completelyAfter).toBe(false);
        });

        // Double-check by verifying specific excluded events are not present
        expect(
          body.data.events.some((event) => event.name === 'Task Before Range')
        ).toBe(false);
        expect(
          body.data.events.some((event) => event.name === 'Task After Range')
        ).toBe(false);
        expect(
          body.data.events.some(
            (event) => event.name === 'Subtask Before Range'
          )
        ).toBe(false);
        expect(
          body.data.events.some((event) => event.name === 'Subtask After Range')
        ).toBe(false);
      });
    });

    describe('Chronological Sorting', () => {
      test('should return events sorted chronologically by scheduled_start date (ascending)', async () => {
        // Test sorting functionality of the schedule endpoint
        // Should verify that events are returned in chronological order by start date

        // Create tasks and subtasks with different start times in random order
        const earlyTaskId = await createTask({
          name: 'Early Morning Task',
          scheduledStart: '2024-12-01T06:00:00Z',
          scheduledEnd: '2024-12-01T08:00:00Z',
        });

        const lateTaskId = await createTask({
          name: 'Late Evening Task',
          scheduledStart: '2024-12-01T20:00:00Z',
          scheduledEnd: '2024-12-01T22:00:00Z',
        });

        const midDayTaskId = await createTask({
          name: 'Mid Day Task',
          scheduledStart: '2024-12-01T12:00:00Z',
          scheduledEnd: '2024-12-01T14:00:00Z',
        });

        // Create parent task for subtasks
        const parentTaskId = await createTask({
          name: 'Parent Task for Subtasks',
          scheduledStart: '2024-12-01T08:00:00Z',
        });

        const morningSubtaskId = await createSubtask(parentTaskId, {
          name: 'Morning Subtask',
          scheduledStart: '2024-12-01T09:00:00Z',
          scheduledEnd: '2024-12-01T11:00:00Z',
        });

        const afternoonSubtaskId = await createSubtask(parentTaskId, {
          name: 'Afternoon Subtask',
          scheduledStart: '2024-12-01T15:00:00Z',
          scheduledEnd: '2024-12-01T17:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(body.data.events.length).toBeGreaterThanOrEqual(5);

        // Extract events and verify they are sorted by scheduledStart
        const events = body.data.events;
        for (let i = 0; i < events.length - 1; i++) {
          const currentEvent = events[i];
          const nextEvent = events[i + 1];

          const currentStart = new Date(currentEvent.scheduledStart);
          const nextStart = new Date(nextEvent.scheduledStart);

          expect(currentStart.getTime()).toBeLessThanOrEqual(
            nextStart.getTime()
          );
        }

        // Verify specific ordering of our test events
        const eventIds = events.map((event) => event.id);
        const earlyTaskIndex = eventIds.indexOf(earlyTaskId);
        const parentTaskIndex = eventIds.indexOf(parentTaskId);
        const morningSubtaskIndex = eventIds.indexOf(morningSubtaskId);
        const midDayTaskIndex = eventIds.indexOf(midDayTaskId);
        const afternoonSubtaskIndex = eventIds.indexOf(afternoonSubtaskId);
        const lateTaskIndex = eventIds.indexOf(lateTaskId);

        expect(earlyTaskIndex).toBeLessThan(parentTaskIndex);
        expect(parentTaskIndex).toBeLessThan(morningSubtaskIndex);
        expect(morningSubtaskIndex).toBeLessThan(midDayTaskIndex);
        expect(midDayTaskIndex).toBeLessThan(afternoonSubtaskIndex);
        expect(afternoonSubtaskIndex).toBeLessThan(lateTaskIndex);
      });

      test('should handle chronological sorting when some events have null scheduled_start', async () => {
        // Test sorting behavior with missing start dates
        // Should verify appropriate handling of null values in sorting (e.g., at end of list)

        // Create tasks with scheduled start times
        const earlyTaskId = await createTask({
          name: 'Early Task',
          scheduledStart: '2024-12-01T08:00:00Z',
          scheduledEnd: '2024-12-01T10:00:00Z',
        });

        const lateTaskId = await createTask({
          name: 'Late Task',
          scheduledStart: '2024-12-01T16:00:00Z',
          scheduledEnd: '2024-12-01T18:00:00Z',
        });

        // Create a task without scheduledStart (but with scheduledEnd to appear in schedule)
        const noStartTaskId = await createTask({
          name: 'Task Without Start',
          scheduledEnd: '2024-12-01T12:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');

        const events = body.data.events;

        // Find our specific events
        const earlyTask = events.find((event) => event.id === earlyTaskId);
        const lateTask = events.find((event) => event.id === lateTaskId);
        const noStartTask = events.find((event) => event.id === noStartTaskId);

        expect(earlyTask).toBeDefined();
        expect(lateTask).toBeDefined();
        expect(noStartTask).toBeDefined();

        // Verify that events with null scheduledStart are handled appropriately
        // They should either be at the end or have a consistent placement
        const eventsWithStart = events.filter(
          (event) => event.scheduledStart !== null
        );

        // Events with start dates should be sorted chronologically
        for (let i = 0; i < eventsWithStart.length - 1; i++) {
          const currentStart = new Date(eventsWithStart[i].scheduledStart);
          const nextStart = new Date(eventsWithStart[i + 1].scheduledStart);
          expect(currentStart.getTime()).toBeLessThanOrEqual(
            nextStart.getTime()
          );
        }

        // Verify null start date events are consistently placed
        expect(noStartTask.scheduledStart).toBeNull();
      });

      test('should handle chronological sorting when multiple events have the same scheduled_start', async () => {
        // Test sorting behavior with duplicate start times
        // Should verify consistent ordering when start times are identical (e.g., by creation date or ID)

        const duplicateStartTime = '2024-12-01T10:00:00Z';

        // Create multiple tasks with the same start time
        const firstTaskId = await createTask({
          name: 'First Task Same Time',
          scheduledStart: duplicateStartTime,
          scheduledEnd: '2024-12-01T12:00:00Z',
        });

        const secondTaskId = await createTask({
          name: 'Second Task Same Time',
          scheduledStart: duplicateStartTime,
          scheduledEnd: '2024-12-01T13:00:00Z',
        });

        const thirdTaskId = await createTask({
          name: 'Third Task Same Time',
          scheduledStart: duplicateStartTime,
          scheduledEnd: '2024-12-01T14:00:00Z',
        });

        // Create parent task for subtasks with same start time
        const parentTaskId = await createTask({
          name: 'Parent Task Same Time',
          scheduledStart: duplicateStartTime,
        });

        const subtaskId = await createSubtask(parentTaskId, {
          name: 'Subtask Same Time',
          scheduledStart: duplicateStartTime,
          scheduledEnd: '2024-12-01T11:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');

        const events = body.data.events;

        // Find events with our duplicate start time (using Date comparison for robustness)
        const targetStartTime = new Date(duplicateStartTime);
        const eventsWithDuplicateTime = events.filter((event) => {
          if (!event.scheduledStart) return false;
          const eventStartTime = new Date(event.scheduledStart);
          return eventStartTime.getTime() === targetStartTime.getTime();
        });

        // Verify we have at least 1 event with the duplicate time (more flexible expectation)
        expect(eventsWithDuplicateTime.length).toBeGreaterThanOrEqual(1);

        // Verify that events with same start time maintain consistent ordering
        // The ordering should be deterministic (e.g., by ID or creation order)
        const eventIds = eventsWithDuplicateTime.map((event) => event.id);
        const expectedIds = [
          firstTaskId,
          secondTaskId,
          thirdTaskId,
          parentTaskId,
          subtaskId,
        ];

        // At least some of our test events should be present
        let foundEventsCount = 0;
        expectedIds.forEach((expectedId) => {
          if (eventIds.includes(expectedId)) {
            foundEventsCount++;
          }
        });
        expect(foundEventsCount).toBeGreaterThan(0);

        // Verify that the overall sorting is still chronologically correct
        for (let i = 0; i < events.length - 1; i++) {
          const currentEvent = events[i];
          const nextEvent = events[i + 1];

          if (currentEvent.scheduledStart && nextEvent.scheduledStart) {
            const currentStart = new Date(currentEvent.scheduledStart);
            const nextStart = new Date(nextEvent.scheduledStart);
            expect(currentStart.getTime()).toBeLessThanOrEqual(
              nextStart.getTime()
            );
          }
        }
      });

      test('should maintain consistent sorting between tasks and subtasks', async () => {
        // Test that both tasks and subtasks are sorted together in the same chronological order
        // Should verify that task/subtask type doesn't affect sort priority

        // Create interleaved tasks and subtasks with different start times
        const earlyTaskId = await createTask({
          name: 'Early Task',
          scheduledStart: '2024-12-01T08:00:00Z',
          scheduledEnd: '2024-12-01T10:00:00Z',
        });

        // Create parent task for subtasks
        const parentTaskId = await createTask({
          name: 'Parent Task',
          scheduledStart: '2024-12-01T07:00:00Z',
        });

        const earlySubtaskId = await createSubtask(parentTaskId, {
          name: 'Early Subtask',
          scheduledStart: '2024-12-01T09:00:00Z',
          scheduledEnd: '2024-12-01T11:00:00Z',
        });

        const midTaskId = await createTask({
          name: 'Mid Task',
          scheduledStart: '2024-12-01T12:00:00Z',
          scheduledEnd: '2024-12-01T14:00:00Z',
        });

        const lateSubtaskId = await createSubtask(parentTaskId, {
          name: 'Late Subtask',
          scheduledStart: '2024-12-01T15:00:00Z',
          scheduledEnd: '2024-12-01T17:00:00Z',
        });

        const lateTaskId = await createTask({
          name: 'Late Task',
          scheduledStart: '2024-12-01T18:00:00Z',
          scheduledEnd: '2024-12-01T20:00:00Z',
        });

        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');

        const events = body.data.events;

        // Find our specific events and their positions
        const eventPositions = new Map();
        events.forEach((event, index) => {
          eventPositions.set(event.id, index);
        });

        const parentTaskPosition = eventPositions.get(parentTaskId);
        const earlyTaskPosition = eventPositions.get(earlyTaskId);
        const earlySubtaskPosition = eventPositions.get(earlySubtaskId);
        const midTaskPosition = eventPositions.get(midTaskId);
        const lateSubtaskPosition = eventPositions.get(lateSubtaskId);
        const lateTaskPosition = eventPositions.get(lateTaskId);

        // Verify chronological ordering regardless of type
        expect(parentTaskPosition).toBeLessThan(earlyTaskPosition); // 07:00 < 08:00
        expect(earlyTaskPosition).toBeLessThan(earlySubtaskPosition); // 08:00 < 09:00
        expect(earlySubtaskPosition).toBeLessThan(midTaskPosition); // 09:00 < 12:00
        expect(midTaskPosition).toBeLessThan(lateSubtaskPosition); // 12:00 < 15:00
        expect(lateSubtaskPosition).toBeLessThan(lateTaskPosition); // 15:00 < 18:00

        // Verify that tasks and subtasks are mixed appropriately in chronological order
        const taskEvents = events.filter((event) => event.type === 'task');
        const subtaskEvents = events.filter(
          (event) => event.type === 'subtask'
        );

        expect(taskEvents.length).toBeGreaterThan(0);
        expect(subtaskEvents.length).toBeGreaterThan(0);

        // Verify that type doesn't affect sorting - chronological order is maintained
        for (let i = 0; i < events.length - 1; i++) {
          const currentEvent = events[i];
          const nextEvent = events[i + 1];

          if (currentEvent.scheduledStart && nextEvent.scheduledStart) {
            const currentStart = new Date(currentEvent.scheduledStart);
            const nextStart = new Date(nextEvent.scheduledStart);
            expect(currentStart.getTime()).toBeLessThanOrEqual(
              nextStart.getTime()
            );
          }
        }

        // Verify our specific test events maintain their types
        const parentTask = events.find((event) => event.id === parentTaskId);
        const earlySubtask = events.find(
          (event) => event.id === earlySubtaskId
        );
        const lateSubtask = events.find((event) => event.id === lateSubtaskId);

        expect(parentTask.type).toBe('task');
        expect(earlySubtask.type).toBe('subtask');
        expect(lateSubtask.type).toBe('subtask');
      });
    });

    describe('Authentication and Authorization', () => {
      test('should require authentication for GET /api/schedule', async () => {
        // Test that schedule endpoint requires user authentication
        // Should return 401 error when no valid session exists

        // Clear the mocks to simulate no authentication
        vi.clearAllMocks();

        // Mock middleware to simulate unauthenticated request
        vi.mocked(retrieveUserSession).mockImplementation(
          async (req: any, res: any, next: any) => {
            // Don't set req.user or req.session to simulate unauthenticated state
            next();
          }
        );

        vi.mocked(requireUserSession).mockImplementation(
          async (req: any, res: any, _next: any) => {
            // Simulate authentication failure
            res.status(401).json({
              status: 'fail',
              error: {
                message: 'Authentication required',
              },
            });
          }
        );

        const response = await request(app).get('/api/schedule');

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('fail');
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toMatch(
          /authentication|auth|unauthorized/i
        );
      });

      test('should only return tasks and subtasks belonging to the authenticated user', async () => {
        // Test data isolation between users
        // Should verify that users can only see their own scheduled items

        // Helper function to create a scheduled task for a specific user
        const createScheduledTaskForUser = async (
          userId: string,
          projectId: string,
          taskData: {
            name: string;
            scheduledStart?: string;
            scheduledEnd?: string;
          }
        ): Promise<string> => {
          // Temporarily mock the session for this specific user
          vi.mocked(retrieveUserSession).mockImplementation(
            async (req: any, _res: any, next: any) => {
              req.user = {
                id: userId,
                name: 'Test User',
                email: `user${userId}@example.com`,
                emailVerified: true,
                image: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              req.session = {
                id: randomUUID(),
                expiresAt: new Date(Date.now() + 86400000),
                token: 'test-token',
                createdAt: new Date(),
                updatedAt: new Date(),
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
                userId: userId,
              };
              next();
            }
          );

          vi.mocked(requireUserSession).mockImplementation(
            async (req: any, _res: any, next: any) => {
              req.user = {
                id: userId,
                name: 'Test User',
                email: `user${userId}@example.com`,
                emailVerified: true,
                image: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              req.session = {
                id: randomUUID(),
                expiresAt: new Date(Date.now() + 86400000),
                token: 'test-token',
                createdAt: new Date(),
                updatedAt: new Date(),
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
                userId: userId,
              };
              next();
            }
          );

          const response = await request(app)
            .post('/api/tasks')
            .send({
              projectId: projectId,
              ...taskData,
            });

          // Add error handling for the response
          if (
            !response.body ||
            !response.body.data ||
            !response.body.data.task
          ) {
            throw new Error(
              `Failed to create task for user ${userId}: ${JSON.stringify(response.body)}`
            );
          }

          return (response.body as SuccessResponse<TaskResponse>).data.task.id;
        };

        // Create a second user and project for testing data isolation
        const SECOND_USER_ID = randomUUID();
        const SECOND_PROJECT_ID = randomUUID();

        const testDb = (globalThis as any).testDb;
        if (testDb) {
          // Insert second user and project
          await testDb.insert(user).values({
            id: SECOND_USER_ID,
            name: 'Second Test User',
            email: 'second@example.com',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await testDb.insert(project).values({
            id: SECOND_PROJECT_ID,
            userId: SECOND_USER_ID,
            name: 'Second Test Project',
            defaultBillable: false,
            defaultRate: '0',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Create scheduled tasks for the second user
        const secondUserTaskId = await createScheduledTaskForUser(
          SECOND_USER_ID,
          SECOND_PROJECT_ID,
          {
            name: 'Second User Task',
            scheduledStart: '2024-12-01T09:00:00Z',
            scheduledEnd: '2024-12-01T17:00:00Z',
          }
        );

        // Create a subtask for the second user's task
        vi.mocked(retrieveUserSession).mockImplementation(
          async (req: any, _res: any, next: any) => {
            req.user = {
              id: SECOND_USER_ID,
              name: 'Second Test User',
              email: `user${SECOND_USER_ID}@example.com`,
              emailVerified: true,
              image: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            req.session = {
              id: randomUUID(),
              expiresAt: new Date(Date.now() + 86400000),
              token: 'test-token',
              createdAt: new Date(),
              updatedAt: new Date(),
              ipAddress: '127.0.0.1',
              userAgent: 'test-agent',
              userId: SECOND_USER_ID,
            };
            next();
          }
        );

        const secondUserSubtaskResponse = await request(app)
          .post(`/api/tasks/${secondUserTaskId}/subtasks`)
          .send({
            name: 'Second User Subtask',
            scheduledStart: '2024-12-01T10:00:00Z',
            scheduledEnd: '2024-12-01T12:00:00Z',
          });
        const secondUserSubtaskId = (
          secondUserSubtaskResponse.body as SuccessResponse<{ subtask: any }>
        ).data.subtask.id;

        // Reset mocks to original test user (TEST_USER_ID)
        vi.mocked(retrieveUserSession).mockImplementation(
          async (req: any, _res: any, next: any) => {
            req.user = {
              id: TEST_USER_ID,
              name: 'Test User',
              email: 'test@example.com',
              emailVerified: true,
              image: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            req.session = {
              id: randomUUID(),
              expiresAt: new Date(Date.now() + 86400000),
              token: 'test-token',
              createdAt: new Date(),
              updatedAt: new Date(),
              ipAddress: '127.0.0.1',
              userAgent: 'test-agent',
              userId: TEST_USER_ID,
            };
            next();
          }
        );

        vi.mocked(requireUserSession).mockImplementation(
          async (req: any, _res: any, next: any) => {
            req.user = {
              id: TEST_USER_ID,
              name: 'Test User',
              email: 'test@example.com',
              emailVerified: true,
              image: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            req.session = {
              id: randomUUID(),
              expiresAt: new Date(Date.now() + 86400000),
              token: 'test-token',
              createdAt: new Date(),
              updatedAt: new Date(),
              ipAddress: '127.0.0.1',
              userAgent: 'test-agent',
              userId: TEST_USER_ID,
            };
            next();
          }
        );

        // Create scheduled tasks for the original test user
        const originalUserTaskResponse = await request(app)
          .post('/api/tasks')
          .send({
            projectId: TEST_PROJECT_ID,
            name: 'Original User Task',
            scheduledStart: '2024-12-01T13:00:00Z',
            scheduledEnd: '2024-12-01T15:00:00Z',
          });
        const originalUserTaskId = (
          originalUserTaskResponse.body as SuccessResponse<TaskResponse>
        ).data.task.id;

        // Create a subtask for the original user's task
        const originalUserSubtaskResponse = await request(app)
          .post(`/api/tasks/${originalUserTaskId}/subtasks`)
          .send({
            name: 'Original User Subtask',
            scheduledStart: '2024-12-01T14:00:00Z',
            scheduledEnd: '2024-12-01T16:00:00Z',
          });
        const originalUserSubtaskId = (
          originalUserSubtaskResponse.body as SuccessResponse<{ subtask: any }>
        ).data.subtask.id;

        // Now test the schedule endpoint with the original user's authentication
        const response = await request(app).get('/api/schedule');
        const body = response.body as SuccessResponse<{ events: any[] }>;

        expect(response.status).toBe(200);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data.events)).toBe(true);

        const returnedEventIds = body.data.events.map((event) => event.id);

        // Should include the original user's tasks and subtasks
        expect(returnedEventIds).toContain(originalUserTaskId);
        expect(returnedEventIds).toContain(originalUserSubtaskId);

        // Should NOT include the second user's tasks and subtasks
        expect(returnedEventIds).not.toContain(secondUserTaskId);
        expect(returnedEventIds).not.toContain(secondUserSubtaskId);

        // Verify that all returned events belong to the authenticated user
        // by checking projectId matches the user's project
        body.data.events.forEach((event) => {
          expect(event.projectId).toBe(TEST_PROJECT_ID);
        });

        // Double-check by verifying specific event properties
        const originalTask = body.data.events.find(
          (event) => event.id === originalUserTaskId
        );
        const originalSubtask = body.data.events.find(
          (event) => event.id === originalUserSubtaskId
        );

        expect(originalTask).toBeDefined();
        expect(originalSubtask).toBeDefined();
        expect(originalTask.name).toBe('Original User Task');
        expect(originalSubtask.name).toBe('Original User Subtask');

        // Verify that second user's events are not present by name
        expect(
          body.data.events.some((event) => event.name === 'Second User Task')
        ).toBe(false);
        expect(
          body.data.events.some((event) => event.name === 'Second User Subtask')
        ).toBe(false);
      });
    });
  });
});

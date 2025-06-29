import { getDb } from '@/db/index';
import { catchAsync } from '@/lib/catch-async';
import { sendApiResponse } from '@/lib/send-api-response';
import { ApiError } from '@repo/shared/api/api-error';
import { project, task } from '@repo/shared/db/schema';
import type {
  TaskRequest,
  TaskResponse,
  // TasksByDayListResponse,
  TasksByProjectListResponse,
} from '@repo/shared/types/task';
import { and, eq } from 'drizzle-orm';
import { NextFunction, Request, Response, type RequestHandler } from 'express';

const ONE_HOUR = 1000 * 60 * 60;

// ##########################################
// TASK CONTROLLER FUNCTIONS
// ##########################################

// Get single task (all fields)
export const getTask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { taskId } = req.params;
    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    const db = getDb();
    const [taskData] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.userId, req.user!.id)))
      .limit(1);

    if (!taskData) {
      return next(new ApiError('Task not found', 404));
    }

    const expectedDuration =
      taskData.scheduledStart && taskData.scheduledEnd
        ? Math.round(
            (new Date(taskData.scheduledEnd).getTime() -
              new Date(taskData.scheduledStart).getTime()) /
              ONE_HOUR
          )
        : undefined;

    sendApiResponse<TaskResponse>({
      res,
      status: 'success',
      statusCode: 200,
      payload: {
        task: {
          ...taskData,
          expectedDuration,
        },
      },
    });
  }
);

// Create task
export const createTask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      projectId,
      name,
      notes,
      isBillable,
      rate,
      scheduledStart,
      scheduledEnd,
      status,
    } = req.body as TaskRequest;

    if (!name) {
      return next(new ApiError('Task name is required', 400));
    }

    if (!projectId) {
      return next(new ApiError('Project ID is required', 400));
    }

    const scheduledStartDate = scheduledStart
      ? new Date(scheduledStart)
      : undefined;
    const scheduledEndDate = scheduledEnd ? new Date(scheduledEnd) : undefined;

    if (scheduledStartDate && scheduledEndDate) {
      if (scheduledEndDate < scheduledStartDate) {
        return next(new ApiError('End date cannot be before start date', 400));
      }
    }

    const db = getDb();
    // Verify project exists and belongs to user
    const [projectData] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.userId, req.user!.id)))
      .limit(1);

    if (!projectData) {
      return next(new ApiError('Project not found', 404));
    }

    const [newTask] = await db
      .insert(task)
      .values({
        userId: req.user!.id,
        projectId,
        name,
        notes: notes || null,
        isBillable: isBillable || false,
        rate: rate || '0',
        scheduledStart: scheduledStartDate,
        scheduledEnd: scheduledEndDate,
        status: status || 'not_started',
      })
      .returning();

    if (!newTask) {
      return next(new ApiError('Failed to create task', 500));
    }

    sendApiResponse<TaskResponse>({
      res,
      status: 'success',
      statusCode: 201,
      payload: {
        task: newTask,
      },
    });
  }
);

// Update task
export const updateTask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { taskId } = req.params;
    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    const {
      projectId,
      name,
      notes,
      isBillable,
      rate,
      scheduledStart,
      scheduledEnd,
      status,
    } = req.body as TaskRequest;

    const db = getDb();

    // Check if task exists and belongs to user
    const [existingTask] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.userId, req.user!.id)))
      .limit(1);

    if (!existingTask) {
      return next(new ApiError('Task not found', 404));
    }

    // Handle scheduling fields: preserve existing if undefined, clear if null, update if string
    const scheduledStartDate =
      scheduledStart === undefined
        ? existingTask.scheduledStart
        : scheduledStart === null
          ? null
          : new Date(scheduledStart);

    const scheduledEndDate =
      scheduledEnd === undefined
        ? existingTask.scheduledEnd
        : scheduledEnd === null
          ? null
          : new Date(scheduledEnd);

    // Validate date range only if both dates are provided and not null
    if (scheduledStartDate && scheduledEndDate) {
      if (scheduledEndDate < scheduledStartDate) {
        return next(new ApiError('End date cannot be before start date', 400));
      }
    }

    // If projectId is being updated, verify the new project exists and belongs to user
    if (projectId && projectId !== existingTask.projectId) {
      const [projectData] = await db
        .select()
        .from(project)
        .where(and(eq(project.id, projectId), eq(project.userId, req.user!.id)))
        .limit(1);

      if (!projectData) {
        return next(new ApiError('Project not found', 404));
      }
    }

    const [updatedTask] = await db
      .update(task)
      .set({
        projectId: projectId ?? existingTask.projectId,
        name: name ?? existingTask.name,
        notes: notes ?? existingTask.notes,
        isBillable: isBillable ?? existingTask.isBillable,
        rate: rate ?? existingTask.rate,
        scheduledStart: scheduledStartDate,
        scheduledEnd: scheduledEndDate,
        status: status ?? existingTask.status,
        updatedAt: new Date(),
      })
      .where(and(eq(task.id, taskId), eq(task.userId, req.user!.id)))
      .returning();

    if (!updatedTask) {
      return next(new ApiError('Failed to update task', 500));
    }

    sendApiResponse<TaskResponse>({
      res,
      status: 'success',
      statusCode: 200,
      payload: {
        task: updatedTask,
      },
    });
  }
);

// Delete task
export const deleteTask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { taskId } = req.params;
    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    const db = getDb();
    // Check if task exists and belongs to user
    const [existingTask] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.userId, req.user!.id)))
      .limit(1);

    if (!existingTask) {
      return next(new ApiError('Task not found', 404));
    }

    await db
      .delete(task)
      .where(and(eq(task.id, taskId), eq(task.userId, req.user!.id)));

    sendApiResponse({
      res,
      status: 'success',
      statusCode: 204,
      payload: null,
    });
  }
);

export const getTasksByProject: RequestHandler = catchAsync(
  async (req, res, next) => {
    const { id: projectId } = req.params;
    if (!projectId) {
      return next(new ApiError('Project ID is required', 400));
    }

    const db = getDb();
    const tasks = await db
      .select({
        id: task.id,
        name: task.name,
        status: task.status,
        scheduledStart: task.scheduledStart,
        scheduledEnd: task.scheduledEnd,
      })
      .from(task)
      .where(and(eq(task.projectId, projectId), eq(task.userId, req.user!.id)));

    sendApiResponse<TasksByProjectListResponse>({
      res,
      status: 'success',
      statusCode: 200,
      payload: {
        tasks: tasks.map((t) => {
          const expectedDuration =
            t.scheduledStart && t.scheduledEnd
              ? Math.round(
                  (new Date(t.scheduledEnd).getTime() -
                    new Date(t.scheduledStart).getTime()) /
                    ONE_HOUR
                )
              : undefined;

          return {
            ...t,
            expectedDuration,
          };
        }),
      },
    });
  }
);

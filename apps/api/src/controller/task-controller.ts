import { db } from '@/db/index';
import { catchAsync } from '@/lib/catch-async';
import { sendApiResponse } from '@/lib/send-api-response';
import { ApiError } from '@repo/shared/api/api-error';
import { project, task } from '@repo/shared/db/schema';
import {
  type TaskRequest,
  type TaskResponse,
  type TasksByDayListResponse,
  type TasksByProjectListResponse,
} from '@repo/shared/types/task';
import { and, eq } from 'drizzle-orm';
import { NextFunction, Request, Response, type RequestHandler } from 'express';

// Get all tasks (only id, name, and expectedDuration)
export const getAllTasks: RequestHandler = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const tasks = await db
      .select({
        id: task.id,
        projectId: task.projectId,
        name: task.name,
        expectedDuration: task.expectedDuration,
        status: task.status,
      })
      .from(task)
      .where(eq(task.userId, req.user!.id));

    sendApiResponse<TasksByDayListResponse>({
      res,
      status: 'success',
      statusCode: 200,
      payload: {
        tasks,
      },
    });
  }
);

// Get single task (all fields)
export const getTask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) {
      return next(new ApiError('Task ID is required', 400));
    }

    const [taskData] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, id), eq(task.userId, req.user!.id)))
      .limit(1);

    if (!taskData) {
      return next(new ApiError('Task not found', 404));
    }

    sendApiResponse<TaskResponse>({
      res,
      status: 'success',
      statusCode: 200,
      payload: {
        task: taskData,
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
      expectedDuration,
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
        expectedDuration: expectedDuration || '0',
        scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
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
    const { id } = req.params;
    if (!id) {
      return next(new ApiError('Task ID is required', 400));
    }

    const {
      projectId,
      name,
      notes,
      isBillable,
      rate,
      expectedDuration,
      scheduledStart,
      scheduledEnd,
      status,
    } = req.body as TaskRequest;

    // Check if task exists and belongs to user
    const [existingTask] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, id), eq(task.userId, req.user!.id)))
      .limit(1);

    if (!existingTask) {
      return next(new ApiError('Task not found', 404));
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
        projectId: projectId || existingTask.projectId,
        name: name || existingTask.name,
        notes: notes !== undefined ? notes : existingTask.notes,
        isBillable:
          isBillable !== undefined ? isBillable : existingTask.isBillable,
        rate: rate !== undefined ? rate : existingTask.rate,
        expectedDuration:
          expectedDuration !== undefined
            ? expectedDuration
            : existingTask.expectedDuration,
        scheduledStart:
          scheduledStart !== undefined
            ? scheduledStart
              ? new Date(scheduledStart)
              : null
            : existingTask.scheduledStart,
        scheduledEnd:
          scheduledEnd !== undefined
            ? scheduledEnd
              ? new Date(scheduledEnd)
              : null
            : existingTask.scheduledEnd,
        status: status || existingTask.status,
        updatedAt: new Date(),
      })
      .where(and(eq(task.id, id), eq(task.userId, req.user!.id)))
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
    const { id } = req.params;
    if (!id) {
      return next(new ApiError('Task ID is required', 400));
    }

    // Check if task exists and belongs to user
    const [existingTask] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, id), eq(task.userId, req.user!.id)))
      .limit(1);

    if (!existingTask) {
      return next(new ApiError('Task not found', 404));
    }

    await db
      .delete(task)
      .where(and(eq(task.id, id), eq(task.userId, req.user!.id)));

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

    const tasks = await db
      .select({
        id: task.id,
        name: task.name,
        expectedDuration: task.expectedDuration,
        status: task.status,
      })
      .from(task)
      .where(and(eq(task.projectId, projectId), eq(task.userId, req.user!.id)));

    sendApiResponse<TasksByProjectListResponse>({
      res,
      status: 'success',
      statusCode: 200,
      payload: {
        tasks,
      },
    });
  }
);

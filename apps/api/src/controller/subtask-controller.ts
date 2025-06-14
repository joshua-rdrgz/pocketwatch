import { db } from '@/db/index';
import { catchAsync } from '@/lib/catch-async';
import { sendApiResponse } from '@/lib/send-api-response';
import { ApiError } from '@repo/shared/api/api-error';
import { subtask, task } from '@repo/shared/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { NextFunction, Request, RequestHandler, Response } from 'express';

// Get subtasks by task ID
export const getSubtasksByTask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: taskId } = req.params;
    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    // Verify task exists and belongs to user
    const [taskData] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.userId, req.user!.id)))
      .limit(1);

    if (!taskData) {
      return next(new ApiError('Task not found', 404));
    }

    const subtasks = await db
      .select()
      .from(subtask)
      .where(and(eq(subtask.taskId, taskId), eq(subtask.userId, req.user!.id)))
      .orderBy(asc(subtask.sortOrder));

    sendApiResponse({
      res,
      status: 'success',
      statusCode: 200,
      payload: {
        subtasks,
      },
    });
  }
);

// Create subtask
export const createSubtask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { taskId, name, notes, sortOrder, isComplete } = req.body;

    if (!name) {
      return next(new ApiError('Subtask name is required', 400));
    }

    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    // Verify task exists and belongs to user
    const [taskData] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.userId, req.user!.id)))
      .limit(1);

    if (!taskData) {
      return next(new ApiError('Task not found', 404));
    }

    const [newSubtask] = await db
      .insert(subtask)
      .values({
        userId: req.user!.id,
        taskId,
        name,
        notes: notes || null,
        sortOrder: sortOrder || 0,
        isComplete: isComplete || false,
      })
      .returning();

    sendApiResponse({
      res,
      status: 'success',
      statusCode: 201,
      payload: {
        subtask: newSubtask,
      },
    });
  }
);

// Update subtask
export const updateSubtask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) {
      return next(new ApiError('Subtask ID is required', 400));
    }

    const { taskId, name, notes, sortOrder, isComplete } = req.body;

    // Check if subtask exists and belongs to user
    const [existingSubtask] = await db
      .select()
      .from(subtask)
      .where(and(eq(subtask.id, id), eq(subtask.userId, req.user!.id)))
      .limit(1);

    if (!existingSubtask) {
      return next(new ApiError('Subtask not found', 404));
    }

    // If taskId is being updated, verify the new task exists and belongs to user
    if (taskId && taskId !== existingSubtask.taskId) {
      const [taskData] = await db
        .select()
        .from(task)
        .where(and(eq(task.id, taskId), eq(task.userId, req.user!.id)))
        .limit(1);

      if (!taskData) {
        return next(new ApiError('Task not found', 404));
      }
    }

    const [updatedSubtask] = await db
      .update(subtask)
      .set({
        taskId: taskId || existingSubtask.taskId,
        name: name || existingSubtask.name,
        notes: notes !== undefined ? notes : existingSubtask.notes,
        sortOrder:
          sortOrder !== undefined ? sortOrder : existingSubtask.sortOrder,
        isComplete:
          isComplete !== undefined ? isComplete : existingSubtask.isComplete,
        updatedAt: new Date(),
      })
      .where(and(eq(subtask.id, id), eq(subtask.userId, req.user!.id)))
      .returning();

    sendApiResponse({
      res,
      status: 'success',
      statusCode: 200,
      payload: {
        subtask: updatedSubtask,
      },
    });
  }
);

// Delete subtask
export const deleteSubtask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) {
      return next(new ApiError('Subtask ID is required', 400));
    }

    // Check if subtask exists and belongs to user
    const [existingSubtask] = await db
      .select()
      .from(subtask)
      .where(and(eq(subtask.id, id), eq(subtask.userId, req.user!.id)))
      .limit(1);

    if (!existingSubtask) {
      return next(new ApiError('Subtask not found', 404));
    }

    await db
      .delete(subtask)
      .where(and(eq(subtask.id, id), eq(subtask.userId, req.user!.id)));

    sendApiResponse({
      res,
      status: 'success',
      statusCode: 204,
      payload: null,
    });
  }
);

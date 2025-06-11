import { Request, Response, NextFunction, RequestHandler } from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/db/index';
import { subtask, task } from '@/db/schema';
import { AppError } from '@/lib/app-error';
import { catchAsync } from '@/lib/catch-async';

// Get subtasks by task ID
export const getSubtasksByTask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const { taskId } = req.params;

    // Verify task exists and belongs to user
    const taskData = await db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.userId, req.user.id)))
      .limit(1);

    if (taskData.length === 0) {
      return next(new AppError('Task not found', 404));
    }

    const subtasks = await db
      .select()
      .from(subtask)
      .where(and(eq(subtask.taskId, taskId), eq(subtask.userId, req.user.id)))
      .orderBy(asc(subtask.sortOrder));

    res.status(200).json({
      status: 'success',
      results: subtasks.length,
      data: {
        subtasks,
      },
    });
  }
);

// Create subtask
export const createSubtask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const { taskId, name, notes, sortOrder, isComplete } = req.body;

    if (!name) {
      return next(new AppError('Subtask name is required', 400));
    }

    if (!taskId) {
      return next(new AppError('Task ID is required', 400));
    }

    // Verify task exists and belongs to user
    const taskData = await db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.userId, req.user.id)))
      .limit(1);

    if (taskData.length === 0) {
      return next(new AppError('Task not found', 404));
    }

    const newSubtask = await db
      .insert(subtask)
      .values({
        userId: req.user.id,
        taskId,
        name,
        notes: notes || null,
        sortOrder: sortOrder || 0,
        isComplete: isComplete || false,
      })
      .returning();

    res.status(201).json({
      status: 'success',
      data: {
        subtask: newSubtask[0],
      },
    });
  }
);

// Update subtask
export const updateSubtask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    const { taskId, name, notes, sortOrder, isComplete } = req.body;

    // Check if subtask exists and belongs to user
    const existingSubtask = await db
      .select()
      .from(subtask)
      .where(and(eq(subtask.id, id), eq(subtask.userId, req.user.id)))
      .limit(1);

    if (existingSubtask.length === 0) {
      return next(new AppError('Subtask not found', 404));
    }

    // If taskId is being updated, verify the new task exists and belongs to user
    if (taskId && taskId !== existingSubtask[0].taskId) {
      const taskData = await db
        .select()
        .from(task)
        .where(and(eq(task.id, taskId), eq(task.userId, req.user.id)))
        .limit(1);

      if (taskData.length === 0) {
        return next(new AppError('Task not found', 404));
      }
    }

    const updatedSubtask = await db
      .update(subtask)
      .set({
        taskId: taskId || existingSubtask[0].taskId,
        name: name || existingSubtask[0].name,
        notes: notes !== undefined ? notes : existingSubtask[0].notes,
        sortOrder:
          sortOrder !== undefined ? sortOrder : existingSubtask[0].sortOrder,
        isComplete:
          isComplete !== undefined ? isComplete : existingSubtask[0].isComplete,
        updatedAt: new Date(),
      })
      .where(and(eq(subtask.id, id), eq(subtask.userId, req.user.id)))
      .returning();

    res.status(200).json({
      status: 'success',
      data: {
        subtask: updatedSubtask[0],
      },
    });
  }
);

// Delete subtask
export const deleteSubtask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;

    // Check if subtask exists and belongs to user
    const existingSubtask = await db
      .select()
      .from(subtask)
      .where(and(eq(subtask.id, id), eq(subtask.userId, req.user.id)))
      .limit(1);

    if (existingSubtask.length === 0) {
      return next(new AppError('Subtask not found', 404));
    }

    await db
      .delete(subtask)
      .where(and(eq(subtask.id, id), eq(subtask.userId, req.user.id)));

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

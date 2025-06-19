import { db } from '@/db/index';
import { catchAsync } from '@/lib/catch-async';
import { sendApiResponse } from '@/lib/send-api-response';
import { ApiError } from '@repo/shared/api/api-error';
import { subtask, task } from '@repo/shared/db/schema';
import type {
  SubtaskRequest,
  SubtaskResponse,
  SubtasksListResponse,
  SubtasksOrderRequest,
} from '@repo/shared/types/subtask';
import { and, asc, eq, sql } from 'drizzle-orm';
import { NextFunction, Request, Response, type RequestHandler } from 'express';

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

    sendApiResponse<SubtasksListResponse>({
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
    const { taskId, name, notes, sortOrder, isComplete } =
      req.body as SubtaskRequest;

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

    if (!newSubtask) {
      return next(new ApiError('Failed to create subtask', 500));
    }

    sendApiResponse<SubtaskResponse>({
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

    const { taskId, name, notes, sortOrder, isComplete } =
      req.body as SubtaskRequest;

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

    if (!updatedSubtask) {
      return next(new ApiError('Failed to update subtask', 500));
    }

    sendApiResponse<SubtaskResponse>({
      res,
      status: 'success',
      statusCode: 200,
      payload: {
        subtask: updatedSubtask,
      },
    });
  }
);

// Update subtask order
export const updateSubtaskOrder: RequestHandler = catchAsync(
  async (req, res, next) => {
    const { id: taskId } = req.params;
    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    const { subtasks } = req.body as SubtasksOrderRequest;

    if (subtasks.length === 0) {
      return next(new ApiError('No subtasks provided', 400));
    }

    /**
     * Builds SQL CASE statement for updating sort orders
     *
     * @example
     * Input: subtasks = [
     *   { id: 'subtask-1', sortOrder: 0 },
     *   { id: 'subtask-2', sortOrder: 1 },
     *   { id: 'subtask-3', sortOrder: 2 }
     * ]
     *
     * Generated SQL:
     * WHEN id = 'subtask-1' THEN 0
     * WHEN id = 'subtask-2' THEN 1
     * WHEN id = 'subtask-3' THEN 2
     */
    const sortOrderCases = subtasks
      .map(
        (st) =>
          sql`WHEN ${subtask.id} = ${st.id} THEN ${sql.raw(st.sortOrder.toString())}`
      )
      .reduce((acc, curr) => sql`${acc} ${curr}`, sql``);

    /**
     * Example SQL generated:
     * UPDATE subtask
     * SET sort_order = CASE
     *   WHEN id = 'subtask-1' THEN 0
     *   WHEN id = 'subtask-2' THEN 1
     *   WHEN id = 'subtask-3' THEN 2
     * END,
     * updated_at = '2024-01-01T00:00:00.000Z'
     * WHERE id IN ('subtask-1', 'subtask-2', 'subtask-3')
     *   AND task_id = 'task-123'
     *   AND user_id = 'user-456'
     */
    await db
      .update(subtask)
      .set({
        sortOrder: sql`CASE ${sortOrderCases} END`,
        updatedAt: new Date(),
      })
      .where(
        and(
          sql`${subtask.id} IN (${sql.join(
            subtasks.map((s) => sql`${s.id}`),
            sql`, `
          )})`,
          eq(subtask.taskId, taskId),
          eq(subtask.userId, req.user!.id)
        )
      );

    // Fetch updated results
    const fetchedSubtasks = await db
      .select()
      .from(subtask)
      .where(and(eq(subtask.taskId, taskId), eq(subtask.userId, req.user!.id)))
      .orderBy(asc(subtask.sortOrder));

    sendApiResponse<SubtasksListResponse>({
      res,
      status: 'success',
      statusCode: 200,
      payload: { subtasks: fetchedSubtasks },
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

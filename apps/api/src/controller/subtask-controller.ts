import { getDb } from '@/db/index';
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
import { and, asc, eq, sql, max } from 'drizzle-orm';
import { NextFunction, Request, Response, type RequestHandler } from 'express';

// Get subtasks by task ID
export const getSubtasksByTask: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { taskId } = req.params;
    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    const db = getDb();
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
    const { taskId } = req.params;
    const { name, notes, isComplete } = req.body as SubtaskRequest;

    if (!name) {
      return next(new ApiError('Subtask name is required', 400));
    }

    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    const db = getDb();
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
        sortOrder: sql`COALESCE((${db
          .select({ maxOrder: max(subtask.sortOrder) })
          .from(subtask)
          .where(
            and(eq(subtask.taskId, taskId), eq(subtask.userId, req.user!.id))
          )}), -1) + 1`,
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
    const { taskId, subtaskId } = req.params;
    if (!subtaskId) {
      return next(new ApiError('Subtask ID is required', 400));
    }
    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    const { name, notes, isComplete } = req.body as SubtaskRequest;

    const db = getDb();
    // Check if subtask exists, belongs to user, and belongs to the specified task
    const [existingSubtask] = await db
      .select()
      .from(subtask)
      .where(
        and(
          eq(subtask.id, subtaskId),
          eq(subtask.taskId, taskId),
          eq(subtask.userId, req.user!.id)
        )
      )
      .limit(1);

    if (!existingSubtask) {
      return next(new ApiError('Subtask not found', 404));
    }

    const [updatedSubtask] = await db
      .update(subtask)
      .set({
        taskId: existingSubtask.taskId,
        name: name || existingSubtask.name,
        notes: notes !== undefined ? notes : existingSubtask.notes,
        sortOrder: existingSubtask.sortOrder,
        isComplete:
          isComplete !== undefined ? isComplete : existingSubtask.isComplete,
        updatedAt: new Date(),
      })
      .where(and(eq(subtask.id, subtaskId), eq(subtask.userId, req.user!.id)))
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
    const { taskId } = req.params;
    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    const { subtasks } = req.body as SubtasksOrderRequest;
    const db = getDb();

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
    const { taskId, subtaskId } = req.params;
    if (!subtaskId) {
      return next(new ApiError('Subtask ID is required', 400));
    }
    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    const db = getDb();
    // Check if subtask exists, belongs to user, and belongs to the specified task
    const [existingSubtask] = await db
      .select()
      .from(subtask)
      .where(
        and(
          eq(subtask.id, subtaskId),
          eq(subtask.taskId, taskId),
          eq(subtask.userId, req.user!.id)
        )
      )
      .limit(1);

    if (!existingSubtask) {
      return next(new ApiError('Subtask not found', 404));
    }

    await db
      .delete(subtask)
      .where(
        and(
          eq(subtask.id, subtaskId),
          eq(subtask.taskId, taskId),
          eq(subtask.userId, req.user!.id)
        )
      );

    sendApiResponse({
      res,
      status: 'success',
      statusCode: 204,
      payload: null,
    });
  }
);

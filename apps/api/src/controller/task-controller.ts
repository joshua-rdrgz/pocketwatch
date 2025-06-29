import { getDb } from '@/db/index';
import { catchAsync } from '@/lib/catch-async';
import { sendApiResponse } from '@/lib/send-api-response';
import { ApiError } from '@repo/shared/api/api-error';
import { project, subtask, task } from '@repo/shared/db/schema';
import type {
  SubtaskCreateRequest,
  SubtaskResponse,
  SubtasksListResponse,
  SubtasksOrderRequest,
  SubtaskUpdateRequest,
  TaskRequest,
  TaskResponse,
  // TasksByDayListResponse,
  TasksByProjectListResponse,
} from '@repo/shared/types/task';
import { and, asc, eq, sql } from 'drizzle-orm';
import { NextFunction, Request, Response, type RequestHandler } from 'express';

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

// ##########################################
// SUBTASK CONTROLLER FUNCTIONS
// ##########################################

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
    const { name, notes, sortOrder, isComplete, scheduledStart, scheduledEnd } =
      req.body as SubtaskCreateRequest;

    if (!name) {
      return next(new ApiError('Subtask name is required', 400));
    }

    if (!taskId) {
      return next(new ApiError('Task ID is required', 400));
    }

    // Handle scheduling dates - convert string to Date or leave undefined for null
    const scheduledStartDate = scheduledStart
      ? new Date(scheduledStart)
      : undefined;
    const scheduledEndDate = scheduledEnd ? new Date(scheduledEnd) : undefined;

    // Validate date range if both dates are provided
    if (scheduledStartDate && scheduledEndDate) {
      if (scheduledEndDate < scheduledStartDate) {
        return next(new ApiError('End date cannot be before start date', 400));
      }
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
        sortOrder: sortOrder || 0,
        isComplete: isComplete || false,
        scheduledStart: scheduledStartDate,
        scheduledEnd: scheduledEndDate,
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

    const { name, notes, sortOrder, isComplete, scheduledStart, scheduledEnd } =
      req.body as SubtaskUpdateRequest;

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

    // Handle scheduling fields: preserve existing if undefined, clear if null, update if string
    const scheduledStartDate =
      scheduledStart === undefined
        ? existingSubtask.scheduledStart
        : scheduledStart === null
          ? null
          : new Date(scheduledStart);

    const scheduledEndDate =
      scheduledEnd === undefined
        ? existingSubtask.scheduledEnd
        : scheduledEnd === null
          ? null
          : new Date(scheduledEnd);

    // Validate date range only if both dates are provided and not null
    if (scheduledStartDate && scheduledEndDate) {
      if (scheduledEndDate < scheduledStartDate) {
        return next(new ApiError('End date cannot be before start date', 400));
      }
    }

    const [updatedSubtask] = await db
      .update(subtask)
      .set({
        taskId: existingSubtask.taskId,
        name: name || existingSubtask.name,
        notes: notes !== undefined ? notes : existingSubtask.notes,
        sortOrder:
          sortOrder !== undefined ? sortOrder : existingSubtask.sortOrder,
        isComplete:
          isComplete !== undefined ? isComplete : existingSubtask.isComplete,
        scheduledStart: scheduledStartDate,
        scheduledEnd: scheduledEndDate,
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

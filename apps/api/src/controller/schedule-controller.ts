/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb } from '@/db';
import { catchAsync } from '@/lib/catch-async';
import { sendApiResponse } from '@/lib/send-api-response';
import { ApiError } from '@repo/shared/api/api-error';
import { task } from '@repo/shared/db/schema';
import type {
  ScheduleItem,
  ScheduleQueryParams,
  ScheduleResponse,
} from '@repo/shared/types/schedule';
import { and, eq, gte, isNotNull, lte, or } from 'drizzle-orm';
import { NextFunction, Request, Response, type RequestHandler } from 'express';

export const getSchedule: RequestHandler = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const db = getDb();
    const { start, end } = req.query as ScheduleQueryParams;

    const { startDate, endDate, filterMode } = parseScheduleDateRange(
      start,
      end
    );

    // Fetch tasks with scheduling information
    const tasks = await db
      .select({
        id: task.id,
        name: task.name,
        notes: task.notes,
        scheduledStart: task.scheduledStart,
        scheduledEnd: task.scheduledEnd,
        projectId: task.projectId,
        isBillable: task.isBillable,
      })
      .from(task)
      .where(
        and(
          eq(task.userId, req.user!.id),
          or(isNotNull(task.scheduledStart), isNotNull(task.scheduledEnd)),
          buildScheduleDateConditions(
            task.scheduledStart,
            task.scheduledEnd,
            startDate,
            endDate,
            filterMode
          )
        )
      );

    // Transform tasks to ScheduleItem format
    const events: ScheduleItem[] = tasks.map((taskItem) => ({
      id: taskItem.id,
      name: taskItem.name,
      notes: taskItem.notes,
      scheduledStart: taskItem.scheduledStart,
      scheduledEnd: taskItem.scheduledEnd,
      projectId: taskItem.projectId,
      isBillable: taskItem.isBillable,
    }));

    // Sort events chronologically
    events.sort((a, b) => {
      const aStart = a.scheduledStart || new Date('1900-01-01');
      const bStart = b.scheduledStart || new Date('1900-01-01');
      return aStart.getTime() - bStart.getTime();
    });

    sendApiResponse<ScheduleResponse>({
      res,
      status: 'success',
      statusCode: 200,
      payload: {
        events,
      },
    });
  }
);

/**
 * Validate schedule query parameters
 * @param start - ISO date string or undefined
 * @param end - ISO date string or undefined
 * @throws ApiError if validation fails
 */
function validateScheduleQueryParams(
  start: string | undefined,
  end: string | undefined
): void {
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  // Validate start date if provided
  if (start) {
    startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      throw new ApiError('Invalid start date format', 400);
    }
  }

  // Validate end date if provided
  if (end) {
    endDate = new Date(end);
    if (isNaN(endDate.getTime())) {
      throw new ApiError('Invalid end date format', 400);
    }
  }

  // Validate that end date is not before start date when both are provided
  if (startDate && endDate && endDate < startDate) {
    throw new ApiError('End date cannot be before start date', 400);
  }
}

/**
 * Parse start and end date query parameters and return a date range
 * @param start - ISO date string or undefined
 * @param end - ISO date string or undefined
 * @returns Object with startDate, endDate, and filterMode
 */
function parseScheduleDateRange(
  start: string | undefined,
  end: string | undefined
): {
  startDate: Date;
  endDate: Date;
  filterMode: 'range' | 'start-only' | 'end-only' | 'current-day';
} {
  // Validate query parameters first
  validateScheduleQueryParams(start, end);

  // Default to current day if no dates provided
  const now = new Date();
  const defaultStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );
  const defaultEnd = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59
    )
  );

  let startDate: Date;
  let endDate: Date;
  let filterMode: 'range' | 'start-only' | 'end-only' | 'current-day';

  // Determine which parameters were provided
  const parameterPattern = `${start ? 'start' : 'none'}-${end ? 'end' : 'none'}`;

  switch (parameterPattern) {
    case 'none-none':
      // No dates provided - use current day
      startDate = defaultStart;
      endDate = defaultEnd;
      filterMode = 'current-day';
      break;

    case 'start-end': {
      // Both dates provided - use range filtering
      const parsedStartDate = new Date(start!);
      const parsedEndDate = new Date(end!);

      // Set start date to beginning of day (00:00:00)
      startDate = new Date(
        Date.UTC(
          parsedStartDate.getUTCFullYear(),
          parsedStartDate.getUTCMonth(),
          parsedStartDate.getUTCDate(),
          0,
          0,
          0
        )
      );

      // Set end date to end of day (23:59:59.999) to include the entire end day
      endDate = new Date(
        Date.UTC(
          parsedEndDate.getUTCFullYear(),
          parsedEndDate.getUTCMonth(),
          parsedEndDate.getUTCDate(),
          23,
          59,
          59,
          999
        )
      );

      filterMode = 'range';
      break;
    }

    case 'start-none': {
      // Only start provided - use start-only filtering
      const parsedStartDate = new Date(start!);

      // Set start date to beginning of day (00:00:00)
      startDate = new Date(
        Date.UTC(
          parsedStartDate.getUTCFullYear(),
          parsedStartDate.getUTCMonth(),
          parsedStartDate.getUTCDate(),
          0,
          0,
          0
        )
      );

      endDate = new Date('2100-12-31'); // Far future for database queries
      filterMode = 'start-only';
      break;
    }

    case 'none-end': {
      // Only end provided - use end-only filtering
      startDate = new Date('1900-01-01'); // Far past for database queries
      const parsedEndDate = new Date(end!);
      // Set end date to end of day (23:59:59.999) to include items ending anywhere within that day
      endDate = new Date(
        Date.UTC(
          parsedEndDate.getUTCFullYear(),
          parsedEndDate.getUTCMonth(),
          parsedEndDate.getUTCDate(),
          23,
          59,
          59,
          999
        )
      );
      filterMode = 'end-only';
      break;
    }

    default:
      // This should never happen, but provide a fallback
      startDate = defaultStart;
      endDate = defaultEnd;
      filterMode = 'current-day';
      break;
  }

  return { startDate, endDate, filterMode };
}

/**
 * Build database conditions for filtering events within a date range
 * @param scheduledStartField - Database field for scheduled start time
 * @param scheduledEndField - Database field for scheduled end time
 * @param startDate - Range start date
 * @param endDate - Range end date
 * @param filterMode - Type of filtering to apply
 * @returns Drizzle OR condition for date filtering
 */
function buildScheduleDateConditions(
  scheduledStartField: any,
  scheduledEndField: any,
  startDate: Date,
  endDate: Date,
  filterMode: 'range' | 'start-only' | 'end-only' | 'current-day'
) {
  switch (filterMode) {
    case 'start-only':
      // Only items that start on or after the start date
      return and(
        isNotNull(scheduledStartField),
        gte(scheduledStartField, startDate)
      );

    case 'end-only':
      // Only items that end on or before the end date
      return and(isNotNull(scheduledEndField), lte(scheduledEndField, endDate));

    case 'range':
    case 'current-day':
    default:
      // Range overlap filtering (original logic)
      return or(
        // Item starts within the range (regardless of end date)
        and(
          isNotNull(scheduledStartField),
          gte(scheduledStartField, startDate),
          lte(scheduledStartField, endDate)
        ),
        // Item ends within the range (regardless of start date)
        and(
          isNotNull(scheduledEndField),
          gte(scheduledEndField, startDate),
          lte(scheduledEndField, endDate)
        ),
        // Item spans the entire range (starts before and ends after)
        and(
          isNotNull(scheduledStartField),
          isNotNull(scheduledEndField),
          lte(scheduledStartField, startDate),
          gte(scheduledEndField, endDate)
        )
      );
  }
}

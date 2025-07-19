import { addDays } from 'date-fns';

/**
 * Returns the CSS top and height (in px) for a schedule item given its start and end times.
 * @param {Date | string} start - Start time (Date object or ISO string)
 * @param {Date | string} end - End time (Date object or ISO string)
 * @returns {{ top: string, height: string }} - CSS Object containing "top" and "height" properties
 */
export const getScheduleItemPosition = (
  start: Date | string,
  end: Date | string
): { top: string; height: string } => {
  const startDate = new Date(start);
  const startHour = startDate.getHours();
  const startMinute = startDate.getMinutes() / 60;

  const endDate = new Date(end);
  const endHour = endDate.getHours();
  const endMinute = endDate.getMinutes() / 60;

  const top = (startHour + startMinute) * 60; // 60px per hour
  const height = (endHour + endMinute - startHour - startMinute) * 60;

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
};

/**
 * Returns a human-readable duration string (e.g., "1h 30m", "45m")
 * for the difference between two dates/times.
 * @param {Date | string} start - Start time (Date object or ISO string)
 * @param {Date | string} end - End time (Date object or ISO string)
 * @returns {string} Duration string, or empty string if invalid/negative duration
 */
export const getScheduleItemDuration = (
  start: Date | string,
  end: Date | string
): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';

  const totalMinutes = Math.floor(
    (endDate.getTime() - startDate.getTime()) / 60000
  );
  if (totalMinutes <= 0) return '';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};

/**
 * Returns the vertical position (in pixels) for the current time line
 * in a 24-hour calendar view, assuming 60px per hour.
 * @returns {number} The top position in pixels for the current time.
 */
export const getCurrentTimePosition = (): number => {
  const now = new Date();
  return (now.getHours() + now.getMinutes() / 60) * 60;
};

/**
 * Generates an array of 7 Date objects representing the days of the week,
 * starting from the given weekStartDate.
 * @param {Date} weekStartDate - The date representing the start of the week.
 * @returns {Date[]} Array of 7 dates for the week.
 */
export const generateWeekDaysFromStartDate = (weekStartDate: Date): Date[] =>
  Array.from({ length: 7 }).map((_, i) => addDays(weekStartDate, i));

/**
 * An array of 24 time slot labels for each hour of the day.
 * @type {string[]}
 */
export const TIME_SLOTS: string[] = Array.from({ length: 24 }).map(
  (_, hour) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }
);

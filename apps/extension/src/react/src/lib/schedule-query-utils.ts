import { QueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Invalidates schedule queries for the given dates
 * @param queryClient - React Query client
 * @param dates - Array of dates that might affect the schedule
 */
export function invalidateScheduleQueries(
  queryClient: QueryClient,
  dates: (Date | string | null | undefined)[]
) {
  const validDates = dates
    .filter((date): date is Date | string => date != null)
    .map((date) => new Date(date))
    .filter((date) => !isNaN(date.getTime()));

  if (validDates.length === 0) {
    return;
  }

  // Get all unique weeks that need to be invalidated
  const weekRanges = new Set<string>();

  validDates.forEach((date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday end

    const startKey = format(weekStart, 'yyyy-MM-dd');
    const endKey = format(weekEnd, 'yyyy-MM-dd');
    const weekKey = `${startKey}_${endKey}`;

    weekRanges.add(weekKey);
  });

  // Invalidate schedule queries for each affected week
  weekRanges.forEach((weekKey) => {
    const [startDate, endDate] = weekKey.split('_');
    queryClient.invalidateQueries({
      queryKey: ['schedule', startDate, endDate],
    });
  });
}

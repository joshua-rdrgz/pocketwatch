import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import {
  ScheduleResponse,
  ScheduleQueryParams,
} from '@repo/shared/types/schedule';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export function useSchedule(selectedDate: Date) {
  // Calculate the week range for the selected date
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 }); // Sunday end

  const queryParams: ScheduleQueryParams = {
    start: format(weekStart, 'yyyy-MM-dd'),
    end: format(weekEnd, 'yyyy-MM-dd'),
  };

  const query = useQuery<ApiResponse<ScheduleResponse>>({
    queryKey: ['schedule', queryParams.start, queryParams.end],
    queryFn: async () => {
      return request({
        method: 'GET',
        url: '/api/schedule',
        params: queryParams,
      });
    },
  });

  return {
    ...query,
    data: query.data?.status === 'success' ? query.data.data.events : undefined,
  };
}

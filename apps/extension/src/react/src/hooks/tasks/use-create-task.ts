import { request } from '@/lib/request';
import { invalidateScheduleQueries } from '@/lib/schedule-query-utils';
import { ApiResponse } from '@repo/shared/types/api';
import type { TaskRequest, TaskResponse } from '@repo/shared/types/task';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TaskResponse>, Error, TaskRequest>({
    mutationFn: async (data) => {
      return request({
        method: 'POST',
        url: '/api/tasks',
        data,
      });
    },
    onSuccess: (response, data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({
        queryKey: ['projects', data.projectId, 'tasks'],
      });

      // Invalidate schedule queries for the scheduled dates
      const task = response.status === 'success' ? response.data.task : null;
      if (task) {
        invalidateScheduleQueries(queryClient, [
          task.scheduledStart,
          task.scheduledEnd,
        ]);
      }
    },
  });
}

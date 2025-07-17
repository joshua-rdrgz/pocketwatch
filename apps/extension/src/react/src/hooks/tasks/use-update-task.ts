import { request } from '@/lib/request';
import { invalidateScheduleQueries } from '@/lib/schedule-query-utils';
import { ApiResponse } from '@repo/shared/types/api';
import { TaskRequest, TaskResponse } from '@repo/shared/types/task';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateTaskVariables {
  id: string;
  data: TaskRequest;
  oldScheduledStart?: Date | string | null;
  oldScheduledEnd?: Date | string | null;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TaskResponse>, Error, UpdateTaskVariables>({
    mutationFn: async ({ id, data }) => {
      return request({
        method: 'PUT',
        url: `/api/tasks/${id}`,
        data,
      });
    },
    onSuccess: (response, { id, data, oldScheduledStart, oldScheduledEnd }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({
        queryKey: ['projects', data.projectId, 'tasks'],
      });

      // Invalidate schedule queries for both old and new scheduled dates
      const task = response.status === 'success' ? response.data.task : null;
      const datesToInvalidate = [
        // Old dates (if they existed)
        oldScheduledStart,
        oldScheduledEnd,
        // New dates (from the response)
        task?.scheduledStart,
        task?.scheduledEnd,
      ];

      invalidateScheduleQueries(queryClient, datesToInvalidate);
    },
  });
}

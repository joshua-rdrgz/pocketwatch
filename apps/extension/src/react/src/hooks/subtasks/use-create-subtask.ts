import { request } from '@/lib/request';
import { invalidateScheduleQueries } from '@/lib/schedule-query-utils';
import { ApiResponse } from '@repo/shared/types/api';
import type {
  SubtaskRequest,
  SubtaskResponse,
} from '@repo/shared/types/subtask';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateSubtaskVariables {
  taskId: string;
  data: SubtaskRequest;
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<SubtaskResponse>,
    Error,
    CreateSubtaskVariables
  >({
    mutationFn: async ({ taskId, data }) => {
      return request({
        method: 'POST',
        url: `/api/tasks/${taskId}/subtasks`,
        data,
      });
    },
    onSuccess: (response, { taskId }) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', taskId, 'subtasks'],
      });

      // Invalidate schedule queries for the scheduled dates
      const subtask =
        response.status === 'success' ? response.data.subtask : null;
      if (subtask) {
        invalidateScheduleQueries(queryClient, [
          subtask.scheduledStart,
          subtask.scheduledEnd,
        ]);
      }
    },
  });
}

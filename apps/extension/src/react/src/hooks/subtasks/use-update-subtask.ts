import { request } from '@/lib/request';
import { invalidateScheduleQueries } from '@/lib/schedule-query-utils';
import { ApiResponse } from '@repo/shared/types/api';
import { SubtaskRequest, SubtaskResponse } from '@repo/shared/types/subtask';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateSubtaskVariables {
  taskId: string;
  subtaskId: string;
  data: SubtaskRequest;
  oldScheduledStart?: Date | string | null;
  oldScheduledEnd?: Date | string | null;
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<SubtaskResponse>,
    Error,
    UpdateSubtaskVariables
  >({
    mutationFn: async ({ taskId, subtaskId, data }) => {
      return request({
        method: 'PUT',
        url: `/api/tasks/${taskId}/subtasks/${subtaskId}`,
        data,
      });
    },
    onSuccess: (response, { taskId, oldScheduledStart, oldScheduledEnd }) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', taskId, 'subtasks'],
      });

      // Invalidate schedule queries for both old and new scheduled dates
      const subtask =
        response.status === 'success' ? response.data.subtask : null;
      const datesToInvalidate = [
        // Old dates (if they existed)
        oldScheduledStart,
        oldScheduledEnd,
        // New dates (from the response)
        subtask?.scheduledStart,
        subtask?.scheduledEnd,
      ];

      invalidateScheduleQueries(queryClient, datesToInvalidate);
    },
  });
}

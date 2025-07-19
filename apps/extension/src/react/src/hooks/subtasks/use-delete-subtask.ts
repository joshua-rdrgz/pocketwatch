import { request } from '@/lib/request';
import { invalidateScheduleQueries } from '@/lib/schedule-query-utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteSubtaskVariables {
  taskId: string;
  subtaskId: string;
  scheduledStart?: Date | string | null;
  scheduledEnd?: Date | string | null;
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteSubtaskVariables>({
    mutationFn: async ({ taskId, subtaskId }) => {
      return request({
        method: 'DELETE',
        url: `/api/tasks/${taskId}/subtasks/${subtaskId}`,
      });
    },
    onSuccess: (_, { taskId, scheduledStart, scheduledEnd }) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', taskId, 'subtasks'],
      });

      // Invalidate schedule queries for the deleted subtask's scheduled dates
      invalidateScheduleQueries(queryClient, [scheduledStart, scheduledEnd]);
    },
  });
}

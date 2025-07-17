import { request } from '@/lib/request';
import { invalidateScheduleQueries } from '@/lib/schedule-query-utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteTaskVariables {
  taskId: string;
  projectIdToInvalidate: string;
  scheduledStart?: Date | string | null;
  scheduledEnd?: Date | string | null;
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteTaskVariables>({
    mutationFn: async ({ taskId }) => {
      return request({
        method: 'DELETE',
        url: `/api/tasks/${taskId}`,
      });
    },
    onSuccess: (_, { projectIdToInvalidate, scheduledStart, scheduledEnd }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({
        queryKey: ['projects', projectIdToInvalidate, 'tasks'],
      });

      // Invalidate schedule queries for the deleted task's scheduled dates
      invalidateScheduleQueries(queryClient, [scheduledStart, scheduledEnd]);
    },
  });
}

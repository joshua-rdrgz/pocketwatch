import { request } from '@/lib/request';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteSubtaskVariables {
  taskId: string;
  subtaskId: string;
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
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', taskId, 'subtasks'],
      });
    },
  });
}

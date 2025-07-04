import { request } from '@/lib/request';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteTaskVariables {
  taskId: string;
  projectIdToInvalidate: string;
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
    onSuccess: (_, { projectIdToInvalidate }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({
        queryKey: ['projects', projectIdToInvalidate, 'tasks'],
      });
    },
  });
}

import { request } from '@/lib/request';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return request({
        method: 'DELETE',
        url: `/api/tasks/${id}`,
      });
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'tasks'],
      });
    },
  });
}

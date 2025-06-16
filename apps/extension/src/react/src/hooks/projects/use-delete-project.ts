import { request } from '@/lib/request';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return request({
        method: 'DELETE',
        url: `/api/projects/${id}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

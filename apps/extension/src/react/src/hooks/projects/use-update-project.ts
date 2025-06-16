import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import { ProjectRequest, ProjectResponse } from '@repo/shared/types/project';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<ProjectResponse>,
    Error,
    { id: string; data: ProjectRequest }
  >({
    mutationFn: async ({ id, data }) => {
      return request({
        method: 'PUT',
        url: `/api/projects/${id}`,
        data,
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}

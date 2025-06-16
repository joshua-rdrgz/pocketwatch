import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import type {
  ProjectRequest,
  ProjectResponse,
} from '@repo/shared/types/project';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<ProjectResponse>, Error, ProjectRequest>({
    mutationFn: async (data) => {
      return request({
        method: 'POST',
        url: '/api/projects',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

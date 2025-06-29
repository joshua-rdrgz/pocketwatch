import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import { ProjectResponse } from '@repo/shared/types/project';
import { useQuery } from '@tanstack/react-query';

export function useProject(id: string) {
  const query = useQuery<ApiResponse<ProjectResponse>>({
    queryKey: ['projects', id],
    queryFn: async () => {
      return request({
        method: 'GET',
        url: `/api/projects/${id}`,
      });
    },
    enabled: !!id,
  });

  return {
    ...query,
    data:
      query.data?.status === 'success' ? query.data.data.project : undefined,
  };
}

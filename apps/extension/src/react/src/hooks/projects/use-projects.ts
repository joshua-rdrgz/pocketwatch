import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import { ProjectsListResponse } from '@repo/shared/types/project';
import { useQuery } from '@tanstack/react-query';

export function useProjects() {
  const query = useQuery<ApiResponse<ProjectsListResponse>>({
    queryKey: ['projects'],
    queryFn: async () => {
      return request({
        method: 'GET',
        url: '/api/projects',
      });
    },
  });

  return {
    ...query,
    data:
      query.data?.status === 'success' ? query.data.data.projects : undefined,
  };
}

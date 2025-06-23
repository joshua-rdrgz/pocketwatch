import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import { TasksByProjectListResponse } from '@repo/shared/types/task';
import { useQuery } from '@tanstack/react-query';

export function useProjectTasks(projectId: string) {
  const query = useQuery<ApiResponse<TasksByProjectListResponse>>({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: async () => {
      return request({
        method: 'GET',
        url: `/api/projects/${projectId}/tasks`,
      });
    },
    enabled: !!projectId,
  });

  return {
    ...query,
    data: query.data?.status === 'success' ? query.data.data.tasks : undefined,
  };
}

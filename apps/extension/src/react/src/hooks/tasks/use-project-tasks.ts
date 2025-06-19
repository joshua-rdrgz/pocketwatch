import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import { TasksListResponse } from '@repo/shared/types/task';
import { useQuery } from '@tanstack/react-query';

export function useProjectTasks(projectId: string) {
  return useQuery<ApiResponse<TasksListResponse>>({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: async () => {
      return request({
        method: 'GET',
        url: `/api/projects/${projectId}/tasks`,
      });
    },
    enabled: !!projectId,
  });
}

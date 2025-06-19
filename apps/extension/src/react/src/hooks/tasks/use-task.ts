import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import { TaskResponse } from '@repo/shared/types/task';
import { useQuery } from '@tanstack/react-query';

export function useTask(id: string) {
  return useQuery<ApiResponse<TaskResponse>>({
    queryKey: ['tasks', id],
    queryFn: async () => {
      return request({
        method: 'GET',
        url: `/api/tasks/${id}`,
      });
    },
    enabled: !!id,
  });
}

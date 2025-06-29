import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import { SubtasksListResponse } from '@repo/shared/types/subtask';
import { useQuery } from '@tanstack/react-query';

export function useSubtasks(taskId: string) {
  const query = useQuery<ApiResponse<SubtasksListResponse>>({
    queryKey: ['tasks', taskId, 'subtasks'],
    queryFn: async () => {
      return request({
        method: 'GET',
        url: `/api/tasks/${taskId}/subtasks`,
      });
    },
    enabled: !!taskId,
  });

  return {
    ...query,
    data:
      query.data?.status === 'success' ? query.data.data.subtasks : undefined,
  };
}

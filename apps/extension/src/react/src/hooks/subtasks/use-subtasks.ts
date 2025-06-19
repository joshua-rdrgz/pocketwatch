import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import { SubtasksListResponse } from '@repo/shared/types/subtask';
import { useQuery } from '@tanstack/react-query';

export function useSubtasks(taskId: string) {
  return useQuery<ApiResponse<SubtasksListResponse>>({
    queryKey: ['tasks', taskId, 'subtasks'],
    queryFn: async () => {
      return request({
        method: 'GET',
        url: `/api/tasks/${taskId}/subtasks`,
      });
    },
    enabled: !!taskId,
  });
}

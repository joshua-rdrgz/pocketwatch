import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import type { TaskRequest, TaskResponse } from '@repo/shared/types/task';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TaskResponse>, Error, TaskRequest>({
    mutationFn: async (data) => {
      return request({
        method: 'POST',
        url: '/api/tasks',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

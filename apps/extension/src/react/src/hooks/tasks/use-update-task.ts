import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import { TaskRequest, TaskResponse } from '@repo/shared/types/task';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<TaskResponse>,
    Error,
    { id: string; data: TaskRequest }
  >({
    mutationFn: async ({ id, data }) => {
      return request({
        method: 'PUT',
        url: `/api/tasks/${id}`,
        data,
      });
    },
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({
        queryKey: ['projects', data.projectId, 'tasks'],
      });
    },
  });
}

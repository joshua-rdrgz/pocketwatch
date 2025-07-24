import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import { SubtaskRequest, SubtaskResponse } from '@repo/shared/types/subtask';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateSubtaskVariables {
  taskId: string;
  subtaskId: string;
  data: SubtaskRequest;
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<SubtaskResponse>,
    Error,
    UpdateSubtaskVariables
  >({
    mutationFn: async ({ taskId, subtaskId, data }) => {
      return request({
        method: 'PUT',
        url: `/api/tasks/${taskId}/subtasks/${subtaskId}`,
        data,
      });
    },
    onSuccess: (_response, { taskId }) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', taskId, 'subtasks'],
      });
    },
  });
}

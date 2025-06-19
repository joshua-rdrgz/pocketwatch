import { request } from '@/lib/request';
import { ApiResponse, SuccessResponse } from '@repo/shared/types/api';
import { SubtaskRequest, SubtaskResponse } from '@repo/shared/types/subtask';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateSubtask(subtaskId: string) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<SubtaskResponse>, Error, SubtaskRequest>({
    mutationFn: async (subtaskData) => {
      return request({
        method: 'PUT',
        url: `/api/subtasks/${subtaskId}`,
        data: subtaskData,
      });
    },
    onSuccess: (d) => {
      queryClient.invalidateQueries({
        queryKey: [
          'tasks',
          (d as SuccessResponse<SubtaskResponse>).data.subtask.taskId,
          'subtasks',
        ],
      });
    },
  });
}

import { request } from '@/lib/request';
import { ApiResponse } from '@repo/shared/types/api';
import {
  SubtasksListResponse,
  SubtasksOrderRequest,
} from '@repo/shared/types/subtask';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface UpdateSubtaskOrderContext {
  previousSubtasks: ApiResponse<SubtasksListResponse> | undefined;
}

export function useUpdateSubtaskOrder(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<SubtasksListResponse>,
    Error,
    SubtasksOrderRequest,
    UpdateSubtaskOrderContext
  >({
    mutationFn: async (orderRequest) => {
      return request({
        method: 'PATCH',
        url: `/api/tasks/${taskId}/subtasks/order`,
        data: orderRequest,
      });
    },
    onMutate: async (newOrder) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['tasks', taskId, 'subtasks'],
      });

      // Snapshot the previous value
      const previousSubtasks = queryClient.getQueryData<
        ApiResponse<SubtasksListResponse>
      >(['tasks', taskId, 'subtasks']);

      // Optimistically update to the new value
      queryClient.setQueryData<ApiResponse<SubtasksListResponse>>(
        ['tasks', taskId, 'subtasks'],
        (old) => {
          if (!old || old.status !== 'success') return old;

          const updatedSubtasks = [...old.data.subtasks];
          // Apply the new sort order
          newOrder.subtasks.forEach(({ id, sortOrder }) => {
            const subtask = updatedSubtasks.find((s) => s.id === id);
            if (subtask) {
              subtask.sortOrder = sortOrder;
            }
          });

          // Sort by the new sort order
          updatedSubtasks.sort((a, b) => a.sortOrder - b.sortOrder);

          return {
            ...old,
            data: {
              ...old.data,
              subtasks: updatedSubtasks,
            },
          };
        }
      );

      // Return a context object with the snapshotted value
      return { previousSubtasks };
    },
    onError: (_err, _newOrder, context) => {
      toast.error(
        'Failed to update subtask order. Changes have been reverted.'
      );
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          ['tasks', taskId, 'subtasks'],
          context.previousSubtasks
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ['tasks', taskId, 'subtasks'],
      });
    },
  });
}

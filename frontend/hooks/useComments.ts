import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '@/lib/api';
import type { Comment, PaginatedResponse } from '@/types';

export const useComments = (postId: string, params?: { page?: number; limit?: number }) => {
  return useQuery<PaginatedResponse<Comment>>({
    queryKey: ['comments', postId, params],
    queryFn: async (): Promise<PaginatedResponse<Comment>> => {
      const response = await commentsApi.getComments(postId, params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      const page = (apiResponse as any).page || 1;
      const limit = (apiResponse as any).limit || 10;
      const total = (apiResponse as any).total || 0;
      const totalPages = Math.ceil(total / limit);
      return {
        data: (apiResponse as any).comments || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    },
    enabled: !!postId,
    placeholderData: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false } },
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: Parameters<typeof commentsApi.createComment>[1] }) => 
      commentsApi.createComment(postId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
};

export const useLikeComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};


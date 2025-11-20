import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api';
import type { Post, PaginatedResponse } from '@/types';

export const usePosts = (params?: { page?: number; limit?: number; userId?: string }) => {
  return useQuery<PaginatedResponse<Post>>({
    queryKey: ['posts', params],
    queryFn: async (): Promise<PaginatedResponse<Post>> => {
      const response = await postsApi.getPosts(params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      const page = (apiResponse as any).page || 1;
      const limit = (apiResponse as any).limit || 10;
      const total = (apiResponse as any).total || 0;
      const totalPages = Math.ceil(total / limit);
      return {
        data: (apiResponse as any).posts || [],
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
    placeholderData: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false } },
  });
};

export const usePost = (id: string) => {
  return useQuery<Post | null>({
    queryKey: ['post', id],
    queryFn: async (): Promise<Post | null> => {
      try {
        const response = await postsApi.getPost(id);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data;
        }
        return (apiResponse as any).post || null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!id,
    placeholderData: null,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof postsApi.createPost>[0]) => postsApi.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => postsApi.likePost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => postsApi.unlikePost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => postsApi.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};


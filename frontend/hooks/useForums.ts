import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumsApi } from '@/lib/api';
import type { ForumPost } from '@/types';

interface CoursePostsResponse {
  posts: ForumPost[];
  count: number;
  total: number;
}

export const useCourseForumPosts = (
  courseId: string,
  params?: {
    type?: 'question' | 'discussion' | 'announcement';
    parentPostId?: string | null;
    tags?: string[];
    search?: string;
    sortBy?: 'newest' | 'oldest' | 'most_voted' | 'most_replied' | 'recent_activity';
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery<CoursePostsResponse>({
    queryKey: ['forum-posts', courseId, params],
    queryFn: async (): Promise<CoursePostsResponse> => {
      const response = await forumsApi.getCoursePosts(courseId, params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return {
        posts: (apiResponse as any).posts || [],
        count: (apiResponse as any).count || 0,
        total: (apiResponse as any).total || 0,
      };
    },
    enabled: !!courseId,
    placeholderData: { posts: [], count: 0, total: 0 },
  });
};

interface PostWithReplies {
  post: ForumPost;
  replies: ForumPost[];
}

export const useForumPost = (id: string) => {
  return useQuery<PostWithReplies | null>({
    queryKey: ['forum-post', id],
    queryFn: async (): Promise<PostWithReplies | null> => {
      try {
        const response = await forumsApi.getPost(id);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data;
        }
        return {
          post: (apiResponse as any).post || null,
          replies: (apiResponse as any).replies || [],
        };
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

export const useCreateForumPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: Parameters<typeof forumsApi.createPost>[1] }) => 
      forumsApi.createPost(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', variables.courseId] });
    },
  });
};

export const useUpdateForumPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof forumsApi.updatePost>[1] }) => 
      forumsApi.updatePost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', variables.id] });
    },
  });
};

export const useDeleteForumPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => forumsApi.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-post'] });
    },
  });
};

export const useVoteForumPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, vote }: { id: string; vote: 'up' | 'down' }) => forumsApi.votePost(id, vote),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });
};


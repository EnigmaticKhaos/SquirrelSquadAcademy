import { api } from '../apiClient';
import type { ApiResponse, ForumPost } from '@/types';

export const forumsApi = {
  getCoursePosts: (
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
    const queryParams: any = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.parentPostId !== undefined) queryParams.parentPostId = params.parentPostId;
    if (params?.tags) queryParams.tags = params.tags;
    if (params?.search) queryParams.search = params.search;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;
    
    return api.get<ApiResponse<{ posts: ForumPost[]; count: number; total: number }>>(`/forums/${courseId}/posts`, { params: queryParams });
  },
  
  getPost: (id: string) => 
    api.get<ApiResponse<{ post: ForumPost; replies: ForumPost[] }>>(`/forums/posts/${id}`),
  
  getPostReplies: (id: string, params?: { sortBy?: string; limit?: number; offset?: number }) => {
    const queryParams: any = {};
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;
    
    return api.get<ApiResponse<{ replies: ForumPost[]; count: number }>>(`/forums/posts/${id}/replies`, { params: queryParams });
  },
  
  createPost: (courseId: string, data: {
    type?: 'question' | 'discussion' | 'announcement';
    title: string;
    content: string;
    parentPostId?: string;
    tags?: string[];
  }) => api.post<ApiResponse<ForumPost>>(`/forums/${courseId}/posts`, data),
  
  updatePost: (id: string, data: { title?: string; content?: string; tags?: string[] }) => 
    api.put<ApiResponse<ForumPost>>(`/forums/posts/${id}`, data),
  
  deletePost: (id: string) => api.delete<ApiResponse<void>>(`/forums/posts/${id}`),
  
  votePost: (id: string, vote: 'up' | 'down') => 
    api.post<ApiResponse<ForumPost>>(`/forums/posts/${id}/vote`, { vote }),
  
  markAsAnswer: (id: string) => 
    api.post<ApiResponse<ForumPost>>(`/forums/posts/${id}/mark-answer`),
  
  pinPost: (id: string) => 
    api.post<ApiResponse<ForumPost>>(`/forums/posts/${id}/pin`),
  
  lockPost: (id: string) => 
    api.post<ApiResponse<ForumPost>>(`/forums/posts/${id}/lock`),
};


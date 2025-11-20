import { api } from '../apiClient';
import type { ApiResponse, Post, Comment, Project, PaginatedResponse } from '@/types';

export const postsApi = {
  getPosts: (params?: { page?: number; limit?: number; filter?: 'all' | 'following' | 'trending' }) =>
    api.get<ApiResponse<PaginatedResponse<Post>>>('/posts', { params }),
  
  getPost: (id: string) => api.get<ApiResponse<Post>>(`/posts/${id}`),
  
  createPost: (data: { content: string; type?: 'text' | 'image' | 'video'; media?: Array<{ url: string; type: string }> }) =>
    api.post<ApiResponse<Post>>('/posts', data),
  
  updatePost: (id: string, data: Partial<Post>) => api.put<ApiResponse<Post>>(`/posts/${id}`, data),
  
  deletePost: (id: string) => api.delete<ApiResponse<void>>(`/posts/${id}`),
  
  likePost: (id: string) => api.post<ApiResponse<Post>>(`/posts/${id}/like`),
  
  unlikePost: (id: string) => api.delete<ApiResponse<Post>>(`/posts/${id}/like`),
  
  sharePost: (id: string) => api.post<ApiResponse<Post>>(`/posts/${id}/share`),
};

export const commentsApi = {
  getComments: (postId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<Comment>>>(`/posts/${postId}/comments`, { params }),
  
  createComment: (postId: string, data: { content: string; parentComment?: string }) =>
    api.post<ApiResponse<Comment>>(`/posts/${postId}/comments`, data),
  
  updateComment: (commentId: string, data: Partial<Comment>) =>
    api.put<ApiResponse<Comment>>(`/comments/${commentId}`, data),
  
  deleteComment: (commentId: string) => api.delete<ApiResponse<void>>(`/comments/${commentId}`),
  
  likeComment: (commentId: string) => api.post<ApiResponse<Comment>>(`/comments/${commentId}/like`),
  
  unlikeComment: (commentId: string) => api.delete<ApiResponse<Comment>>(`/comments/${commentId}/like`),
};

export const projectsApi = {
  getProjects: (params?: { page?: number; limit?: number; category?: string; tags?: string[] }) =>
    api.get<ApiResponse<PaginatedResponse<Project>>>('/projects', { params }),
  
  getProject: (id: string) => api.get<ApiResponse<Project>>(`/projects/${id}`),
  
  createProject: (data: Partial<Project>) => api.post<ApiResponse<Project>>('/projects', data),
  
  updateProject: (id: string, data: Partial<Project>) => api.put<ApiResponse<Project>>(`/projects/${id}`, data),
  
  deleteProject: (id: string) => api.delete<ApiResponse<void>>(`/projects/${id}`),
  
  likeProject: (id: string) => api.post<ApiResponse<Project>>(`/projects/${id}/like`),
  
  unlikeProject: (id: string) => api.delete<ApiResponse<Project>>(`/projects/${id}/like`),
};


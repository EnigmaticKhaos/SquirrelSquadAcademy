import { api } from '../apiClient';
import type { ApiResponse, SearchResult, Course, User, Post, Project, PaginatedResponse } from '@/types';

export interface SearchParams {
  type?: 'all' | 'users' | 'courses' | 'posts' | 'comments' | 'lessons' | 'projects';
  page?: number;
  limit?: number;
  // Course filters
  courseType?: string;
  difficulty?: string;
  category?: string;
  tags?: string[];
  isFree?: boolean;
  minRating?: number;
  // Post filters
  userId?: string;
  postType?: 'text' | 'image' | 'video';
  // Project filters
  courseId?: string;
  projectType?: 'github' | 'deployed' | 'file' | 'code';
  language?: string;
  // Sort options
  sort?: 'relevance' | 'newest' | 'popular' | 'rating';
}

export const searchApi = {
  // Global search
  search: (query: string, params?: SearchParams) => {
    const searchParams: any = { q: query, ...params };
    if (params?.tags) {
      searchParams.tags = params.tags.join(',');
    }
    return api.get<ApiResponse<SearchResult>>('/search', { params: searchParams });
  },

  // Search courses
  searchCourses: (query: string, params?: {
    courseType?: string;
    difficulty?: string;
    category?: string;
    tags?: string[];
    isFree?: boolean;
    minRating?: number;
    sort?: 'relevance' | 'newest' | 'popular' | 'rating';
    page?: number;
    limit?: number;
  }) => {
    const searchParams: any = { q: query, ...params };
    if (params?.tags) {
      searchParams.tags = params.tags.join(',');
    }
    return api.get<ApiResponse<PaginatedResponse<Course>>>('/search/courses', { params: searchParams });
  },

  // Search users
  searchUsers: (query: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<User>>>('/search/users', { params: { q: query, ...params } }),

  // Search posts
  searchPosts: (query: string, params?: {
    userId?: string;
    type?: 'text' | 'image' | 'video';
    sort?: 'relevance' | 'newest' | 'popular';
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<PaginatedResponse<Post>>>('/search/posts', { params: { q: query, ...params } }),

  // Search projects
  searchProjects: (query: string, params?: {
    userId?: string;
    courseId?: string;
    category?: string;
    tags?: string[];
    type?: 'github' | 'deployed' | 'file' | 'code';
    language?: string;
    sort?: 'relevance' | 'newest' | 'popular';
    page?: number;
    limit?: number;
  }) => {
    const searchParams: any = { q: query, ...params };
    if (params?.tags) {
      searchParams.tags = params.tags.join(',');
    }
    return api.get<ApiResponse<PaginatedResponse<Project>>>('/search/projects', { params: searchParams });
  },
};


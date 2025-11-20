import { useQuery } from '@tanstack/react-query';
import { searchApi, type SearchParams } from '@/lib/api/search';
import type { SearchResult, Course, User, Post, Project } from '@/types';

export const useSearch = (query: string, params?: SearchParams) => {
  return useQuery({
    queryKey: ['search', query, params],
    queryFn: async (): Promise<SearchResult | null> => {
      if (!query.trim()) return null;
      const response = await searchApi.search(query, params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      // Handle different response structures
      const data = apiResponse as any;
      return {
        courses: data.courses || [],
        users: data.users || [],
        posts: data.posts || [],
        projects: data.projects || [],
        total: data.total || 0,
      };
    },
    enabled: !!query.trim(),
    placeholderData: null,
  });
};

export const useSearchCourses = (query: string, params?: {
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
  return useQuery({
    queryKey: ['search', 'courses', query, params],
    queryFn: async (): Promise<Course[]> => {
      if (!query.trim()) return [];
      const response = await searchApi.searchCourses(query, params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return (apiResponse.data as any).courses || apiResponse.data.data || [];
      }
      return (apiResponse as any).courses || [];
    },
    enabled: !!query.trim(),
    placeholderData: [],
  });
};

export const useSearchUsers = (query: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['search', 'users', query, params],
    queryFn: async (): Promise<User[]> => {
      if (!query.trim()) return [];
      const response = await searchApi.searchUsers(query, params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return (apiResponse.data as any).users || apiResponse.data.data || [];
      }
      return (apiResponse as any).users || [];
    },
    enabled: !!query.trim(),
    placeholderData: [],
  });
};

export const useSearchPosts = (query: string, params?: {
  userId?: string;
  type?: 'text' | 'image' | 'video';
  sort?: 'relevance' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['search', 'posts', query, params],
    queryFn: async (): Promise<Post[]> => {
      if (!query.trim()) return [];
      const response = await searchApi.searchPosts(query, params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return (apiResponse.data as any).posts || apiResponse.data.data || [];
      }
      return (apiResponse as any).posts || [];
    },
    enabled: !!query.trim(),
    placeholderData: [],
  });
};

export const useSearchProjects = (query: string, params?: {
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
  return useQuery({
    queryKey: ['search', 'projects', query, params],
    queryFn: async (): Promise<Project[]> => {
      if (!query.trim()) return [];
      const response = await searchApi.searchProjects(query, params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return (apiResponse.data as any).projects || apiResponse.data.data || [];
      }
      return (apiResponse as any).projects || [];
    },
    enabled: !!query.trim(),
    placeholderData: [],
  });
};


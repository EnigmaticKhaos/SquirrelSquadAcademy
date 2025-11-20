import { api } from '../apiClient';
import type { ApiResponse, Note, PaginatedResponse } from '@/types';

export const notesApi = {
  getNotes: (params?: {
    tags?: string[];
    isHighlight?: boolean;
    isPinned?: boolean;
    courseId?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) => {
    const queryParams: any = {};
    if (params?.tags) queryParams.tags = params.tags;
    if (params?.isHighlight !== undefined) queryParams.isHighlight = params.isHighlight;
    if (params?.isPinned !== undefined) queryParams.isPinned = params.isPinned;
    if (params?.courseId) queryParams.courseId = params.courseId;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;
    if (params?.search) queryParams.search = params.search;
    
    return api.get<ApiResponse<{ notes: Note[]; total: number }>>('/notes', { params: queryParams });
  },
  
  getNote: (id: string) => api.get<ApiResponse<Note>>(`/notes/${id}`),
  
  createNote: (data: {
    lessonId: string;
    courseId: string;
    title?: string;
    content: string;
    isHighlight?: boolean;
    highlightedText?: string;
    highlightStart?: number;
    highlightEnd?: number;
    highlightColor?: string;
    position?: {
      section?: string;
      timestamp?: number;
      paragraphIndex?: number;
    };
    tags?: string[];
    isPinned?: boolean;
  }) => api.post<ApiResponse<Note>>('/notes', data),
  
  updateNote: (id: string, data: {
    title?: string;
    content?: string;
    tags?: string[];
    isPinned?: boolean;
    highlightColor?: string;
  }) => api.put<ApiResponse<Note>>(`/notes/${id}`, data),
  
  deleteNote: (id: string) => api.delete<ApiResponse<void>>(`/notes/${id}`),
  
  getLessonNotes: (lessonId: string) => api.get<ApiResponse<{ notes: Note[]; count: number }>>(`/notes/lesson/${lessonId}`),
  
  getCourseNotes: (courseId: string, params?: { tags?: string[]; isHighlight?: boolean; isPinned?: boolean }) => {
    const queryParams: any = {};
    if (params?.tags) queryParams.tags = params.tags;
    if (params?.isHighlight !== undefined) queryParams.isHighlight = params.isHighlight;
    if (params?.isPinned !== undefined) queryParams.isPinned = params.isPinned;
    return api.get<ApiResponse<{ notes: Note[]; count: number }>>(`/notes/course/${courseId}`, { params: queryParams });
  },
  
  searchNotes: (query: string) => api.get<ApiResponse<Note[]>>('/notes/search', { params: { q: query } }),
  
  getTags: () => api.get<ApiResponse<string[]>>('/notes/tags'),
  
  togglePin: (id: string) => api.post<ApiResponse<Note>>(`/notes/${id}/pin`),
};


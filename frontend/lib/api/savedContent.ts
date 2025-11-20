import { api } from '../apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types';

export type SavedContentType = 'course' | 'lesson' | 'post' | 'project' | 'forum_post';

export interface SavedContent {
  _id: string;
  user: string;
  contentType: SavedContentType;
  contentId: string;
  folder?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Populated content (varies by type)
  content?: any;
}

export const savedContentApi = {
  getSavedContent: (params?: { 
    contentType?: SavedContentType; 
    folder?: string; 
    tags?: string[];
    page?: number;
    limit?: number;
  }) => {
    const queryParams: any = {};
    if (params?.contentType) queryParams.contentType = params.contentType;
    if (params?.folder) queryParams.folder = params.folder;
    if (params?.tags) queryParams.tags = params.tags;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    
    return api.get<ApiResponse<PaginatedResponse<SavedContent>>>('/saved-content', { params: queryParams });
  },
  
  saveContent: (data: {
    contentType: SavedContentType;
    contentId: string;
    folder?: string;
    tags?: string[];
    notes?: string;
  }) => api.post<ApiResponse<{ savedContent: SavedContent }>>('/saved-content', data),
  
  unsaveContent: (contentType: SavedContentType, contentId: string) =>
    api.delete<ApiResponse<void>>(`/saved-content/${contentType}/${contentId}`),
  
  isContentSaved: (contentType: SavedContentType, contentId: string) =>
    api.get<ApiResponse<{ isSaved: boolean }>>(`/saved-content/check/${contentType}/${contentId}`),
  
  updateSavedContent: (contentType: SavedContentType, contentId: string, data: {
    folder?: string;
    tags?: string[];
    notes?: string;
  }) => api.put<ApiResponse<{ savedContent: SavedContent }>>(`/saved-content/${contentType}/${contentId}`, data),
  
  getFolders: () => api.get<ApiResponse<string[]>>('/saved-content/folders'),
  
  getTags: () => api.get<ApiResponse<string[]>>('/saved-content/tags'),
  
  getStats: () => api.get<ApiResponse<{
    total: number;
    byType: Record<SavedContentType, number>;
  }>>('/saved-content/stats'),
};


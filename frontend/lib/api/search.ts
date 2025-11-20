import { api } from '../apiClient';
import type { ApiResponse, SearchResult } from '@/types';

export const searchApi = {
  search: (query: string, params?: { type?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<SearchResult>>('/search', { params: { q: query, ...params } }),
};


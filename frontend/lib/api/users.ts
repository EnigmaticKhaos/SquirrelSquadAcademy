import { api } from '../apiClient';
import type { ApiResponse, User, PaginatedResponse } from '@/types';

export const usersApi = {
  // Get user profile
  getUserProfile: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  
  // Get user stats
  getUserStats: (id: string) => api.get<ApiResponse<any>>(`/users/${id}/stats`),
  
  // Update profile
  updateProfile: (data: Partial<User>) => api.put<ApiResponse<User>>('/users/profile', data),
  
  // Update settings
  updateSettings: (data: any) => api.put<ApiResponse<User>>('/users/settings', data),
  
  // Delete account
  deleteAccount: (password: string) => api.delete<ApiResponse<void>>('/users/account', { data: { password } }),
};


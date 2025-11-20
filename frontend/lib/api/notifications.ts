import { api } from '../apiClient';
import type { ApiResponse, Notification, PaginatedResponse } from '@/types';

export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number; type?: string; unreadOnly?: boolean }) =>
    api.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', { params }),
  
  markAsRead: (id: string) => api.put<ApiResponse<Notification>>(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.put<ApiResponse<void>>('/notifications/read-all'),
  
  deleteNotification: (id: string) => api.delete<ApiResponse<void>>(`/notifications/${id}`),
  
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
};


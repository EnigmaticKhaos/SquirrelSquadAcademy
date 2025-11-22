import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

// Types
export type AnnouncementType = 'platform' | 'course' | 'maintenance' | 'feature';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface TargetAudience {
  allUsers?: boolean;
  userRoles?: ('user' | 'admin')[];
  subscriptionTiers?: ('free' | 'premium')[];
  enrolledCourses?: string[];
  specificUsers?: string[];
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  targetAudience?: TargetAudience;
  course?: string;
  scheduledFor?: string;
  publishedAt?: string;
  expiresAt?: string;
  imageUrl?: string;
  videoUrl?: string;
  actionUrl?: string;
  views: number;
  readBy?: string[];
  author: string;
  isRead?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementsResponse {
  count: number;
  total: number;
  unreadCount: number;
  announcements: Announcement[];
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: AnnouncementType;
  priority?: AnnouncementPriority;
  targetAudience?: TargetAudience;
  courseId?: string;
  scheduledFor?: string;
  expiresAt?: string;
  imageUrl?: string;
  videoUrl?: string;
  actionUrl?: string;
}

export interface UpdateAnnouncementData extends Partial<CreateAnnouncementData> {
  status?: AnnouncementStatus;
}

export interface GetAnnouncementsParams {
  type?: AnnouncementType;
  courseId?: string;
  includeRead?: boolean;
  limit?: number;
  offset?: number;
}

// API Client
export const announcementsApi = {
  // Get user's announcements
  getAnnouncements: (params?: GetAnnouncementsParams) => {
    const queryParams: any = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.courseId) queryParams.courseId = params.courseId;
    if (params?.includeRead !== undefined) queryParams.includeRead = params.includeRead;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;
    
    return api.get<ApiResponse<AnnouncementsResponse>>('/announcements', { params: queryParams });
  },
  
  // Get single announcement
  getAnnouncement: (id: string) =>
    api.get<ApiResponse<{ announcement: Announcement }>>(`/announcements/${id}`),
  
  // Mark announcement as read
  markAsRead: (id: string) =>
    api.put<ApiResponse<{ announcement: Announcement; message: string }>>(`/announcements/${id}/read`),
  
  // Admin: Create announcement
  createAnnouncement: (data: CreateAnnouncementData) =>
    api.post<ApiResponse<{ announcement: Announcement; message: string }>>('/announcements', data),
  
  // Admin: Update announcement
  updateAnnouncement: (id: string, data: UpdateAnnouncementData) =>
    api.put<ApiResponse<{ announcement: Announcement; message: string }>>(`/announcements/${id}`, data),
  
  // Admin: Delete announcement
  deleteAnnouncement: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/announcements/${id}`),
  
  // Admin: Publish announcement
  publishAnnouncement: (id: string) =>
    api.post<ApiResponse<{ announcement: Announcement; message: string }>>(`/announcements/${id}/publish`),
  
  // Admin: Get all announcements
  getAllAnnouncements: (params?: { status?: AnnouncementStatus; limit?: number; offset?: number }) => {
    const queryParams: any = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;
    
    return api.get<ApiResponse<{ announcements: Announcement[]; total: number }>>('/announcements/admin/all', { params: queryParams });
  },
  
  // Admin: Process scheduled announcements
  processScheduled: () =>
    api.post<ApiResponse<{ message: string; processed: number }>>('/announcements/process-scheduled'),
};


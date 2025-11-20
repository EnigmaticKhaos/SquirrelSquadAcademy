import { api } from '../apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface WaitlistEntry {
  _id: string;
  user: string | {
    _id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  course: string | {
    _id: string;
    title: string;
    thumbnail?: string;
  };
  position: number;
  status: 'waiting' | 'notified' | 'enrolled' | 'removed' | 'expired';
  notifiedAt?: string;
  notificationSent: boolean;
  enrolledAt?: string;
  expiresAt?: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WaitlistStatus {
  isFull: boolean;
  hasWaitlist: boolean;
  maxEnrollments?: number;
  currentEnrollments: number;
  userPosition: number | null;
  isOnWaitlist?: boolean;
}

export const waitlistApi = {
  /**
   * Join course waitlist
   */
  joinWaitlist: (courseId: string, expiresInDays?: number) =>
    api.post<ApiResponse<WaitlistEntry>>(
      `/course-waitlist/${courseId}/join`,
      expiresInDays ? { expiresInDays } : {}
    ),

  /**
   * Leave course waitlist
   */
  leaveWaitlist: (courseId: string) =>
    api.post<ApiResponse<{ message: string }>>(`/course-waitlist/${courseId}/leave`, {}),

  /**
   * Get waitlist status for a course
   */
  getWaitlistStatus: (courseId: string) =>
    api.get<ApiResponse<WaitlistStatus>>(`/course-waitlist/${courseId}/status`),

  /**
   * Get user's position in waitlist
   */
  getWaitlistPosition: (courseId: string) =>
    api.get<ApiResponse<{ position: number }>>(`/course-waitlist/${courseId}/position`),

  /**
   * Get user's waitlist entries
   */
  getUserWaitlist: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<{ waitlist: WaitlistEntry[]; total: number }>>('/course-waitlist/user/entries', { params }),

  /**
   * Get course waitlist (Admin only)
   */
  getCourseWaitlist: (courseId: string, params?: { status?: string; limit?: number; offset?: number }) =>
    api.get<ApiResponse<{ waitlist: WaitlistEntry[]; total: number; count: number }>>(
      `/course-waitlist/${courseId}`,
      { params }
    ),
};


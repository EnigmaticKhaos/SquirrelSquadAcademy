import { api } from '../apiClient';
import type { ApiResponse, Course, PaginatedResponse, CourseReview, CourseBundle } from '@/types';

export const coursesApi = {
  // Get all courses
  getCourses: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    courseType?: string;
    search?: string;
  }) => api.get<ApiResponse<PaginatedResponse<Course>>>('/courses', { params }),
  
  // Get single course
  getCourse: (id: string) => api.get<ApiResponse<Course>>(`/courses/${id}`),
  
  // Enroll in course
  enrollInCourse: (id: string) => api.post<ApiResponse<Course>>(`/courses/${id}/enroll`),
  
  // Create course (admin)
  createCourse: (data: Partial<Course>) => api.post<ApiResponse<Course>>('/courses', data),
  
  // Update course (admin)
  updateCourse: (id: string, data: Partial<Course>) => api.put<ApiResponse<Course>>(`/courses/${id}`, data),
  
  // Delete course (admin)
  deleteCourse: (id: string) => api.delete<ApiResponse<void>>(`/courses/${id}`),
  
  // Publish course (admin)
  publishCourse: (id: string) => api.post<ApiResponse<Course>>(`/courses/${id}/publish`),
  
  // Set coming soon (admin)
  setComingSoon: (id: string) => api.post<ApiResponse<Course>>(`/courses/${id}/coming-soon`),
};

export const courseReviewsApi = {
  // Get course reviews
  getReviews: (courseId: string, params?: { page?: number; limit?: number; rating?: number }) =>
    api.get<ApiResponse<PaginatedResponse<CourseReview>>>(`/course-reviews/course/${courseId}`, { params }),
  
  // Create review
  createReview: (courseId: string, data: { rating: number; content: string; title?: string; difficultyRating?: number }) =>
    api.post<ApiResponse<CourseReview>>(`/course-reviews/course/${courseId}`, data),
  
  // Update review
  updateReview: (reviewId: string, data: Partial<CourseReview>) =>
    api.put<ApiResponse<CourseReview>>(`/course-reviews/${reviewId}`, data),
  
  // Delete review
  deleteReview: (reviewId: string) => api.delete<ApiResponse<void>>(`/course-reviews/${reviewId}`),
  
  // Vote on review
  voteReview: (reviewId: string, helpful: boolean) =>
    api.post<ApiResponse<CourseReview>>(`/course-reviews/${reviewId}/vote`, { helpful }),
};

export const courseBundlesApi = {
  // Get all bundles
  getBundles: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get<ApiResponse<PaginatedResponse<CourseBundle>>>('/course-bundles', { params }),
  
  // Get single bundle
  getBundle: (id: string) => api.get<ApiResponse<CourseBundle>>(`/course-bundles/${id}`),
  
  // Purchase bundle
  purchaseBundle: (id: string) => api.post<ApiResponse<{ sessionId: string }>>(`/course-bundles/${id}/purchase`),
};

export const courseWaitlistApi = {
  // Join waitlist
  joinWaitlist: (courseId: string) => api.post<ApiResponse<void>>(`/course-waitlist/${courseId}/join`),
  
  // Leave waitlist
  leaveWaitlist: (courseId: string) => api.delete<ApiResponse<void>>(`/course-waitlist/${courseId}`),
  
  // Get waitlist status
  getWaitlistStatus: (courseId: string) => api.get<ApiResponse<{ isOnWaitlist: boolean; position?: number }>>(`/course-waitlist/${courseId}/status`),
};


import { api } from '../apiClient';
import type {
  ApiResponse,
  CourseAnalytics,
  LearningAnalyticsSummary,
  LearningCalendarDay,
  PerformanceMetrics,
} from '@/types';

export type LearningActivityType =
  | 'lesson'
  | 'quiz'
  | 'assignment'
  | 'video'
  | 'reading'
  | 'practice';

export interface LearningAnalyticsFilters {
  courseId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CalendarQuery {
  year?: number;
  month?: number;
}

export const analyticsApi = {
  getLearningAnalytics: (params?: LearningAnalyticsFilters) =>
    api.get<ApiResponse<{ analytics: LearningAnalyticsSummary }>>('/analytics/learning', {
      params,
    }),

  getCourseAnalytics: (courseId: string) =>
    api.get<ApiResponse<{ analytics: CourseAnalytics }>>(`/analytics/courses/${courseId}`),

  getLearningCalendar: (params?: CalendarQuery) =>
    api.get<ApiResponse<{ year: number; month: number; calendar: LearningCalendarDay[] }>>(
      '/analytics/calendar',
      { params }
    ),

  getPerformanceMetrics: () =>
    api.get<ApiResponse<{ metrics: PerformanceMetrics }>>('/analytics/performance'),

  startSession: (data: {
    courseId?: string;
    lessonId?: string;
    moduleId?: string;
    activityType: LearningActivityType;
  }) => api.post<ApiResponse<{ session: any }>>('/analytics/sessions/start', data),

  endSession: (sessionId: string) =>
    api.post<ApiResponse<{ session: any }>>(`/analytics/sessions/${sessionId}/end`),
};


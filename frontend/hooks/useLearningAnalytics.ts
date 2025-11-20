import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  analyticsApi,
  type CalendarQuery,
  type LearningActivityType,
  type LearningAnalyticsFilters,
} from '@/lib/api/analytics';
import type {
  CourseAnalytics,
  LearningAnalyticsSummary,
  LearningCalendarDay,
  PerformanceMetrics,
} from '@/types';

const getAnalyticsData = async (filters?: LearningAnalyticsFilters) => {
  const response = await analyticsApi.getLearningAnalytics(filters);
  const payload = response.data;
  if (payload.data) {
    return (payload.data as { analytics: LearningAnalyticsSummary }).analytics;
  }
  return (payload as any).analytics as LearningAnalyticsSummary;
};

export const useLearningAnalytics = (filters?: LearningAnalyticsFilters) => {
  return useQuery<LearningAnalyticsSummary>({
    queryKey: ['learning-analytics', filters],
    queryFn: () => getAnalyticsData(filters),
    placeholderData: {
      totalTimeSpent: 0,
      totalSessions: 0,
      averageSessionDuration: 0,
      coursesCompleted: 0,
      coursesInProgress: 0,
      assignmentsCompleted: 0,
      averageScore: 0,
      currentStreaks: { login: 0, activity: 0 },
      longestStreaks: { login: 0, activity: 0 },
      timeByActivity: {},
      timeByCourse: [],
      weeklyActivity: [],
      monthlyActivity: [],
    },
  });
};

export const useCourseAnalytics = (courseId?: string) => {
  return useQuery<CourseAnalytics | null>({
    queryKey: ['course-analytics', courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      if (!courseId) return null;
      const response = await analyticsApi.getCourseAnalytics(courseId);
      const payload = response.data;
      if (payload.data) {
        return (payload.data as { analytics: CourseAnalytics }).analytics;
      }
      return (payload as any).analytics as CourseAnalytics;
    },
    placeholderData: null,
  });
};

export const useLearningCalendar = (params?: CalendarQuery) => {
  return useQuery<LearningCalendarDay[]>({
    queryKey: ['learning-calendar', params],
    queryFn: async () => {
      const response = await analyticsApi.getLearningCalendar(params);
      const payload = response.data;
      if (payload.data) {
        return (payload.data as { calendar: LearningCalendarDay[] }).calendar;
      }
      return (payload as any).calendar as LearningCalendarDay[];
    },
    placeholderData: [],
  });
};

export const usePerformanceMetrics = () => {
  return useQuery<PerformanceMetrics>({
    queryKey: ['learning-performance'],
    queryFn: async () => {
      const response = await analyticsApi.getPerformanceMetrics();
      const payload = response.data;
      if (payload.data) {
        return (payload.data as { metrics: PerformanceMetrics }).metrics;
      }
      return (payload as any).metrics as PerformanceMetrics;
    },
    placeholderData: {
      overallAverageScore: 0,
      improvementTrend: 'stable',
      strongAreas: [],
      weakAreas: [],
      completionRate: 0,
    },
  });
};

export const useStartLearningSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      courseId?: string;
      lessonId?: string;
      moduleId?: string;
      activityType: LearningActivityType;
    }) => analyticsApi.startSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['learning-calendar'] });
    },
  });
};

export const useEndLearningSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => analyticsApi.endSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['learning-calendar'] });
    },
  });
};


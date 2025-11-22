import { useQuery } from '@tanstack/react-query';
import {
  adminApi,
  type DashboardAnalytics,
  type UserAnalytics,
  type CourseAnalytics,
  type RevenueAnalytics,
  type GamificationAnalytics,
  type SocialAnalytics,
  type LearningAnalytics,
  type ReferralAnalytics,
  type ProjectAnalytics,
  type ModerationAnalytics,
  type MentorApplicationAnalytics,
  type AnalyticsParams,
} from '@/lib/api/admin';

export const useAdminDashboard = (params?: AnalyticsParams) => {
  return useQuery<DashboardAnalytics>({
    queryKey: ['admin-dashboard', params],
    queryFn: async () => {
      const response = await adminApi.getDashboard(params);
      const data = response.data.data || response.data;
      return data as DashboardAnalytics;
    },
  });
};

export const useAdminUserAnalytics = (params?: AnalyticsParams) => {
  return useQuery<UserAnalytics>({
    queryKey: ['admin-analytics-users', params],
    queryFn: async () => {
      const response = await adminApi.getUserAnalytics(params);
      const data = response.data.data || response.data;
      return data as UserAnalytics;
    },
  });
};

export const useAdminCourseAnalytics = (params?: AnalyticsParams) => {
  return useQuery<CourseAnalytics>({
    queryKey: ['admin-analytics-courses', params],
    queryFn: async () => {
      const response = await adminApi.getCourseAnalytics(params);
      const data = response.data.data || response.data;
      return data as CourseAnalytics;
    },
  });
};

export const useAdminRevenueAnalytics = (params?: AnalyticsParams) => {
  return useQuery<RevenueAnalytics>({
    queryKey: ['admin-analytics-revenue', params],
    queryFn: async () => {
      const response = await adminApi.getRevenueAnalytics(params);
      const data = response.data.data || response.data;
      return data as RevenueAnalytics;
    },
  });
};

export const useAdminGamificationAnalytics = () => {
  return useQuery<GamificationAnalytics>({
    queryKey: ['admin-analytics-gamification'],
    queryFn: async () => {
      const response = await adminApi.getGamificationAnalytics();
      const data = response.data.data || response.data;
      return data as GamificationAnalytics;
    },
  });
};

export const useAdminSocialAnalytics = (params?: AnalyticsParams) => {
  return useQuery<SocialAnalytics>({
    queryKey: ['admin-analytics-social', params],
    queryFn: async () => {
      const response = await adminApi.getSocialAnalytics(params);
      const data = response.data.data || response.data;
      return data as SocialAnalytics;
    },
  });
};

export const useAdminLearningAnalytics = (params?: AnalyticsParams) => {
  return useQuery<LearningAnalytics>({
    queryKey: ['admin-analytics-learning', params],
    queryFn: async () => {
      const response = await adminApi.getLearningAnalytics(params);
      const data = response.data.data || response.data;
      return data as LearningAnalytics;
    },
  });
};

export const useAdminReferralAnalytics = () => {
  return useQuery<ReferralAnalytics>({
    queryKey: ['admin-analytics-referrals'],
    queryFn: async () => {
      const response = await adminApi.getReferralAnalytics();
      const data = response.data.data || response.data;
      return data as ReferralAnalytics;
    },
  });
};

export const useAdminProjectAnalytics = () => {
  return useQuery<ProjectAnalytics>({
    queryKey: ['admin-analytics-projects'],
    queryFn: async () => {
      const response = await adminApi.getProjectAnalytics();
      const data = response.data.data || response.data;
      return data as ProjectAnalytics;
    },
  });
};

export const useAdminModerationAnalytics = () => {
  return useQuery<ModerationAnalytics>({
    queryKey: ['admin-analytics-moderation'],
    queryFn: async () => {
      const response = await adminApi.getModerationAnalytics();
      const data = response.data.data || response.data;
      return data as ModerationAnalytics;
    },
  });
};

export const useAdminMentorApplicationAnalytics = () => {
  return useQuery<MentorApplicationAnalytics>({
    queryKey: ['admin-analytics-mentor-applications'],
    queryFn: async () => {
      const response = await adminApi.getMentorApplicationAnalytics();
      const data = response.data.data || response.data;
      return data as MentorApplicationAnalytics;
    },
  });
};


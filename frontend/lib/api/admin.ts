import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

// Analytics response types
export interface DashboardAnalytics {
  users: UserAnalytics;
  courses: CourseAnalytics;
  revenue: RevenueAnalytics;
  gamification: GamificationAnalytics;
  social: SocialAnalytics;
  learning: LearningAnalytics;
  referrals: ReferralAnalytics;
  projects: ProjectAnalytics;
  moderation: ModerationAnalytics;
  mentorApplications: MentorApplicationAnalytics;
  generatedAt?: string;
}

export interface UserAnalytics {
  total: number;
  new: number;
  active: number;
  premium: number;
  free: number;
  verified: number;
  with2FA: number;
  mentors: {
    total: number;
    active: number;
  };
  growth: {
    daily: Array<{ _id: string; count: number }>;
  };
  averages: {
    level: number;
    xp: number;
  };
}

export interface CourseAnalytics {
  total: number;
  published: number;
  draft: number;
  comingSoon: number;
  byType?: {
    coding: number;
    nonCoding: number;
  };
  coding?: number;
  nonCoding?: number;
  enrollments: number;
  completions: number;
  reviews: number;
  popular?: Array<{
    _id: string;
    title: string;
    status: string;
    courseType: string;
    enrollmentCount: number;
  }>;
  popularCourses?: Array<{
    _id: string;
    title: string;
    status: string;
    courseType: string;
    enrollmentCount: number;
  }>;
  completionRates?: Array<{
    _id: string;
    title: string;
    completionRate: number;
  }>;
  averageRating?: number;
}

export interface RevenueAnalytics {
  premiumUsers?: number;
  freeUsers?: number;
  conversionRate?: number;
  trends?: {
    subscriptions?: Array<{ _id: string; count: number }>;
  };
  total?: number;
  monthly?: number;
  subscriptions?: number;
  oneTimePurchases?: number;
  refunds?: number;
  revenueByMonth?: Array<{ month: string; revenue: number }>;
  topProducts?: Array<{ name: string; revenue: number }>;
}

export interface GamificationAnalytics {
  xp?: {
    total: number;
    bySource?: Array<{ _id: string; total: number; count: number }>;
  };
  totalXP?: number;
  achievements?: {
    total: number;
    unlocked: number;
    tiers: number;
    byTier?: Array<{ _id: string; count: number }>;
  };
  totalAchievements?: number;
  badges?: {
    total: number;
    earned: number;
    tiers: number;
    byTier?: Array<{ _id: string; count: number }>;
  };
  totalBadges?: number;
  activeUsers?: number;
  topUsers?: Array<{ userId: string; username: string; xp: number; level: number }>;
  popularAchievements?: Array<{ achievementId: string; name: string; earnedCount: number }>;
}

export interface SocialAnalytics {
  posts?: {
    total: number;
    withImages?: number;
    withVideos?: number;
  };
  totalPosts?: number;
  comments?: {
    total: number;
  };
  totalComments?: number;
  likes?: {
    total: number;
  };
  totalLikes?: number;
  activeUsers?: number;
  engagementRate?: number;
  topPosts?: Array<{ postId: string; title: string; likes: number; comments: number }>;
}

export interface LearningAnalytics {
  totalSessions?: number;
  averageSessionDuration?: number;
  activeLearners?: number;
  completionRate?: number;
  averageProgress?: number;
  topCourses?: Array<{ courseId: string; title: string; sessions: number }>;
  sessions?: {
    total: number;
    averageDuration: number;
  };
  learners?: {
    active: number;
  };
}

export interface ReferralAnalytics {
  totalReferrals: number;
  activeReferrers: number;
  totalRewards: number;
  conversionRate: number;
  topReferrers: Array<{ userId: string; username: string; referrals: number }>;
}

export interface ProjectAnalytics {
  totalProjects: number;
  collaborativeProjects: number;
  activeProjects: number;
  totalMembers: number;
  completionRate: number;
}

export interface ModerationAnalytics {
  pendingReports: number;
  resolvedReports: number;
  bannedUsers: number;
  suspendedUsers: number;
  warningsIssued: number;
}

export interface MentorApplicationAnalytics {
  pending: number;
  approved: number;
  rejected: number;
  totalMentors: number;
  activeMentorships: number;
}

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
}

// API Client
export const adminApi = {
  // Get comprehensive dashboard analytics
  getDashboard: (params?: AnalyticsParams) => {
    const queryParams: any = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    return api.get<ApiResponse<DashboardAnalytics>>('/admin/dashboard', { params: queryParams });
  },
  
  // Get user analytics
  getUserAnalytics: (params?: AnalyticsParams) => {
    const queryParams: any = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    return api.get<ApiResponse<UserAnalytics>>('/admin/analytics/users', { params: queryParams });
  },
  
  // Get course analytics
  getCourseAnalytics: (params?: AnalyticsParams) => {
    const queryParams: any = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    return api.get<ApiResponse<CourseAnalytics>>('/admin/analytics/courses', { params: queryParams });
  },
  
  // Get revenue analytics
  getRevenueAnalytics: (params?: AnalyticsParams) => {
    const queryParams: any = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    return api.get<ApiResponse<RevenueAnalytics>>('/admin/analytics/revenue', { params: queryParams });
  },
  
  // Get gamification analytics
  getGamificationAnalytics: () =>
    api.get<ApiResponse<GamificationAnalytics>>('/admin/analytics/gamification'),
  
  // Get social analytics
  getSocialAnalytics: (params?: AnalyticsParams) => {
    const queryParams: any = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    return api.get<ApiResponse<SocialAnalytics>>('/admin/analytics/social', { params: queryParams });
  },
  
  // Get learning analytics
  getLearningAnalytics: (params?: AnalyticsParams) => {
    const queryParams: any = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    return api.get<ApiResponse<LearningAnalytics>>('/admin/analytics/learning', { params: queryParams });
  },
  
  // Get referral analytics
  getReferralAnalytics: () =>
    api.get<ApiResponse<ReferralAnalytics>>('/admin/analytics/referrals'),
  
  // Get project analytics
  getProjectAnalytics: () =>
    api.get<ApiResponse<ProjectAnalytics>>('/admin/analytics/projects'),
  
  // Get moderation analytics
  getModerationAnalytics: () =>
    api.get<ApiResponse<ModerationAnalytics>>('/admin/analytics/moderation'),
  
  // Get mentor application analytics
  getMentorApplicationAnalytics: () =>
    api.get<ApiResponse<MentorApplicationAnalytics>>('/admin/analytics/mentor-applications'),
};


import { api } from '../apiClient';
import type { ApiResponse, Achievement, Badge, Challenge, LeaderboardEntry, PaginatedResponse } from '@/types';

export const achievementsApi = {
  getAchievements: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Achievement>>>('/achievements', { params }),
  
  getAchievement: (id: string, params?: { userId?: string }) => 
    api.get<ApiResponse<Achievement>>(`/achievements/${id}`, { params }),
  
  getUserAchievements: (userId: string) => api.get<ApiResponse<Achievement[]>>(`/achievements/user/${userId}`),
};

export const badgesApi = {
  getBadges: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Badge>>>('/badges', { params }),
  
  getBadge: (id: string, params?: { userId?: string }) => 
    api.get<ApiResponse<Badge>>(`/badges/${id}`, { params }),
  
  getUserBadges: (userId: string) => api.get<ApiResponse<Badge[]>>(`/badges/user/${userId}`),
};

export const challengesApi = {
  getChallenges: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Challenge>>>('/challenges', { params }),
  
  getChallenge: (id: string, params?: { userId?: string }) => 
    api.get<ApiResponse<{ challenge: Challenge; participant: any; eligibility: any }>>(`/challenges/${id}`, { params }),
  
  joinChallenge: (id: string) => api.post<ApiResponse<Challenge>>(`/challenges/${id}/join`),
  
  leaveChallenge: (id: string) => api.delete<ApiResponse<void>>(`/challenges/${id}/join`),
  
  getChallengeLeaderboard: (id: string) => api.get<ApiResponse<LeaderboardEntry[]>>(`/challenges/${id}/leaderboard`),
};

export const leaderboardApi = {
  getLeaderboard: (
    type: 'global-xp' | 'global-level' | 'global-achievements' | 'global-badges' | 'course-xp' | 'course-completion' | 'friends-xp' | 'friends-achievements' | 'category' | 'learning_streak' | 'challenge',
    params?: { courseId?: string; challengeId?: string; category?: string; limit?: number; offset?: number; userId?: string }
  ) => {
    const queryParams: any = {};
    if (params?.courseId) queryParams.courseId = params.courseId;
    if (params?.challengeId) queryParams.challengeId = params.challengeId;
    if (params?.category) queryParams.category = params.category;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;
    if (params?.userId) queryParams.userId = params.userId;
    
    return api.get<ApiResponse<{ type: string; count: number; leaderboard: LeaderboardEntry[]; userRank: number | null }>>(`/leaderboards/${type}`, { params: queryParams });
  },
  
  getUserRank: (
    type: 'global-xp' | 'global-level' | 'global-achievements' | 'global-badges' | 'course-xp' | 'course-completion' | 'friends-xp' | 'friends-achievements' | 'category' | 'learning_streak' | 'challenge',
    params?: { courseId?: string; challengeId?: string; category?: string; userId: string }
  ) => {
    const queryParams: any = { userId: params?.userId };
    if (params?.courseId) queryParams.courseId = params.courseId;
    if (params?.challengeId) queryParams.challengeId = params.challengeId;
    if (params?.category) queryParams.category = params.category;
    
    return api.get<ApiResponse<{ rank: number; value: number }>>(`/leaderboards/${type}/rank`, { params: queryParams });
  },
};


import { api } from '../apiClient';
import type { ApiResponse, Achievement, Badge, Challenge, LeaderboardEntry, PaginatedResponse } from '@/types';

export const achievementsApi = {
  getAchievements: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Achievement>>>('/achievements', { params }),
  
  getAchievement: (id: string) => api.get<ApiResponse<Achievement>>(`/achievements/${id}`),
  
  getUserAchievements: (userId: string) => api.get<ApiResponse<Achievement[]>>(`/achievements/user/${userId}`),
};

export const badgesApi = {
  getBadges: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Badge>>>('/badges', { params }),
  
  getBadge: (id: string) => api.get<ApiResponse<Badge>>(`/badges/${id}`),
  
  getUserBadges: (userId: string) => api.get<ApiResponse<Badge[]>>(`/badges/user/${userId}`),
};

export const challengesApi = {
  getChallenges: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Challenge>>>('/challenges', { params }),
  
  getChallenge: (id: string) => api.get<ApiResponse<Challenge>>(`/challenges/${id}`),
  
  joinChallenge: (id: string) => api.post<ApiResponse<Challenge>>(`/challenges/${id}/join`),
  
  leaveChallenge: (id: string) => api.delete<ApiResponse<void>>(`/challenges/${id}/join`),
  
  getChallengeLeaderboard: (id: string) => api.get<ApiResponse<LeaderboardEntry[]>>(`/challenges/${id}/leaderboard`),
};

export const leaderboardApi = {
  getLeaderboard: (params?: { period?: 'daily' | 'weekly' | 'monthly' | 'all-time'; category?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<LeaderboardEntry>>>('/leaderboards', { params }),
};


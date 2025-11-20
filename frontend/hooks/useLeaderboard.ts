import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '@/lib/api';
import type { LeaderboardEntry } from '@/types';

type LeaderboardType = 'global-xp' | 'global-level' | 'global-achievements' | 'global-badges' | 'course-xp' | 'course-completion' | 'friends-xp' | 'friends-achievements' | 'category' | 'learning_streak' | 'challenge';

interface UseLeaderboardParams {
  type: LeaderboardType;
  courseId?: string;
  challengeId?: string;
  category?: string;
  limit?: number;
  offset?: number;
  userId?: string;
  enabled?: boolean;
}

interface LeaderboardResponse {
  type: string;
  count: number;
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
}

export const useLeaderboard = (params: UseLeaderboardParams) => {
  const { type, enabled = true, ...apiParams } = params;
  
  return useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', type, apiParams],
    queryFn: async (): Promise<LeaderboardResponse> => {
      const response = await leaderboardApi.getLeaderboard(type, apiParams);
      // Backend returns { success: true, type, count, leaderboard, userRank }
      // response.data is ApiResponse<LeaderboardResponse>, so response.data.data contains the actual data
      // But looking at the backend, it returns the data directly in the response, not nested
      const apiResponse = response.data;
      // The backend returns the data directly, not nested in a 'data' property
      return {
        type: (apiResponse as any).type || type,
        count: (apiResponse as any).count || 0,
        leaderboard: (apiResponse as any).leaderboard || [],
        userRank: (apiResponse as any).userRank || null,
      };
    },
    enabled: enabled && !!type,
    placeholderData: { type, count: 0, leaderboard: [], userRank: null },
  });
};

export const useUserLeaderboardRank = (
  type: LeaderboardType,
  userId: string,
  params?: { courseId?: string; challengeId?: string; category?: string }
) => {
  return useQuery<{ rank: number; value: number }>({
    queryKey: ['leaderboard-rank', type, userId, params],
    queryFn: async (): Promise<{ rank: number; value: number }> => {
      const response = await leaderboardApi.getUserRank(type, { ...params, userId });
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return {
        rank: (apiResponse as any).rank || 0,
        value: (apiResponse as any).value || 0,
      };
    },
    enabled: !!type && !!userId,
    placeholderData: { rank: 0, value: 0 },
  });
};


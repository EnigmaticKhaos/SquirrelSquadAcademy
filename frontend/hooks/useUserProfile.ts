import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import type { User } from '@/types';

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      try {
        const response = await usersApi.getUserProfile(userId);
        // Backend returns { success: true, user: {...}, badges: [...] }
        // Check if response.data.user exists (direct structure) or response.data.data (wrapped structure)
        return (response.data as any).user || response.data.data || null;
      } catch (error: any) {
        // If 404, return null instead of throwing
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!userId,
    // Return null as placeholder data to prevent undefined
    placeholderData: null,
  });
};

export const useUserStats = (userId: string) => {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      try {
        const response = await usersApi.getUserStats(userId);
        // Backend returns { success: true, stats: {...} }
        // Stats object has: xp, achievements, badges, coursesCompleted
        const stats = (response.data as any).stats || response.data.data;
        if (stats) {
          return {
            achievements: stats.achievements || 0,
            badges: stats.badges || 0,
            completedCourses: stats.coursesCompleted || 0,
          };
        }
        return { achievements: 0, badges: 0, completedCourses: 0 };
      } catch (error: any) {
        // If error, return default stats
        if (error.response?.status === 404) {
          return { achievements: 0, badges: 0, completedCourses: 0 };
        }
        // For other errors, return default stats instead of throwing
        return { achievements: 0, badges: 0, completedCourses: 0 };
      }
    },
    enabled: !!userId,
    // Return default stats as placeholder data
    placeholderData: { achievements: 0, badges: 0, completedCourses: 0 },
  });
};


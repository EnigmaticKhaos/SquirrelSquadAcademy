import { api } from '../apiClient';
import type {
  ApiResponse,
  LearningGoal,
  LearningGoalStats,
  LearningGoalType,
} from '@/types';

export interface LearningGoalFilters {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface LearningGoalRewardPayload {
  xpReward?: number;
  badgeReward?: string;
  achievementReward?: string;
}

export interface LearningGoalPayload extends LearningGoalRewardPayload {
  title: string;
  description?: string;
  type: LearningGoalType;
  targetValue: number;
  customCriteria?: {
    type?: string;
    value?: any;
    [key: string]: any;
  };
  hasDeadline?: boolean;
  deadline?: string | null;
}

export interface UpdateLearningGoalPayload extends LearningGoalRewardPayload {
  title?: string;
  description?: string;
  targetValue?: number;
  customCriteria?: {
    type?: string;
    value?: any;
    [key: string]: any;
  };
  hasDeadline?: boolean;
  deadline?: string | null;
}

export const learningGoalsApi = {
  getGoals: (params?: LearningGoalFilters) =>
    api.get<ApiResponse<{ goals: LearningGoal[]; total: number; page: number; pages: number }>>(
      '/learning-goals',
      { params }
    ),

  getGoal: (id: string) => api.get<ApiResponse<LearningGoal>>(`/learning-goals/${id}`),

  createGoal: (data: LearningGoalPayload) => api.post<ApiResponse<LearningGoal>>('/learning-goals', data),

  updateGoal: (id: string, data: UpdateLearningGoalPayload) =>
    api.put<ApiResponse<LearningGoal>>(`/learning-goals/${id}`, data),

  deleteGoal: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/learning-goals/${id}`),

  toggleGoalPause: (id: string, action: 'pause' | 'resume' = 'pause') =>
    api.put<ApiResponse<{ message: string; goal: LearningGoal }>>(`/learning-goals/${id}/${action}`),

  updateGoalProgress: (id: string) =>
    api.post<ApiResponse<{ goal: LearningGoal }>>(`/learning-goals/${id}/update-progress`),

  updateAllGoals: () =>
    api.post<ApiResponse<{ message: string }>>('/learning-goals/update-all'),

  getGoalStats: () => api.get<ApiResponse<{ stats: LearningGoalStats }>>('/learning-goals/stats'),
};

export type { LearningGoalFilters as LearningGoalQueryParams, LearningGoalPayload, UpdateLearningGoalPayload };

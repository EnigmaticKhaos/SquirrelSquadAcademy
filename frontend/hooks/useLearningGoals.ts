import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { learningGoalsApi } from '@/lib/api';
import type {
  LearningGoalQueryParams,
  LearningGoalPayload,
  UpdateLearningGoalPayload,
} from '@/lib/api/learningGoals';
import type { LearningGoal, LearningGoalStats, PaginatedResponse } from '@/types';

const defaultStats: LearningGoalStats = {
  total: 0,
  active: 0,
  completed: 0,
  failed: 0,
  byType: {},
};

const buildPagination = (
  page: number,
  limit: number,
  total: number,
  totalPages?: number
) => ({
  page,
  limit,
  total,
  totalPages: totalPages ?? Math.max(1, Math.ceil(total / (limit || 1))),
  hasNext: page < (totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)))),
  hasPrev: page > 1,
});

export const useLearningGoals = (params?: LearningGoalQueryParams) => {
  const limit = params?.limit ?? 20;

  return useQuery<PaginatedResponse<LearningGoal>>({
    queryKey: ['learning-goals', params],
    queryFn: async () => {
      const response = await learningGoalsApi.getGoals(params);
      const payload = response.data;

      if (payload.data) {
        return payload.data as PaginatedResponse<LearningGoal>;
      }

      const goals = (payload as any).goals || [];
      const page = (payload as any).page || 1;
      const total = (payload as any).total ?? goals.length;
      const totalPages = (payload as any).pages;

      return {
        data: goals,
        pagination: buildPagination(page, limit, total, totalPages),
      };
    },
    placeholderData: {
      data: [],
      pagination: buildPagination(1, limit, 0, 1),
    },
  });
};

export const useLearningGoal = (id?: string) => {
  return useQuery<LearningGoal | null>({
    queryKey: ['learning-goal', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      try {
        const response = await learningGoalsApi.getGoal(id);
        const payload = response.data;
        if (payload.data) {
          return payload.data as LearningGoal;
        }
        return (payload as any).goal || null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    placeholderData: null,
  });
};

const invalidateGoalQueries = (queryClient: ReturnType<typeof useQueryClient>, goalId?: string) => {
  queryClient.invalidateQueries({ queryKey: ['learning-goals'] });
  queryClient.invalidateQueries({ queryKey: ['learning-goals-stats'] });
  if (goalId) {
    queryClient.invalidateQueries({ queryKey: ['learning-goal', goalId] });
  }
};

export const useCreateLearningGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LearningGoalPayload) => learningGoalsApi.createGoal(data),
    onSuccess: () => {
      invalidateGoalQueries(queryClient);
    },
  });
};

export const useUpdateLearningGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLearningGoalPayload }) =>
      learningGoalsApi.updateGoal(id, data),
    onSuccess: (_, variables) => {
      invalidateGoalQueries(queryClient, variables.id);
    },
  });
};

export const useDeleteLearningGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => learningGoalsApi.deleteGoal(id),
    onSuccess: (_, id) => {
      invalidateGoalQueries(queryClient, id);
    },
  });
};

export const useToggleLearningGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action?: 'pause' | 'resume' }) =>
      learningGoalsApi.toggleGoalPause(id, action),
    onSuccess: (_, variables) => {
      invalidateGoalQueries(queryClient, variables.id);
    },
  });
};

export const useLearningGoalProgressUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => learningGoalsApi.updateGoalProgress(id),
    onSuccess: (_, id) => {
      invalidateGoalQueries(queryClient, id);
    },
  });
};

export const useUpdateAllLearningGoals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => learningGoalsApi.updateAllGoals(),
    onSuccess: () => {
      invalidateGoalQueries(queryClient);
    },
  });
};

export const useLearningGoalStats = () => {
  return useQuery<LearningGoalStats>({
    queryKey: ['learning-goals-stats'],
    queryFn: async () => {
      const response = await learningGoalsApi.getGoalStats();
      const payload = response.data;
      if (payload.data) {
        return payload.data as LearningGoalStats;
      }
      return (payload as any).stats || defaultStats;
    },
    placeholderData: defaultStats,
  });
};


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '@/lib/api';
import type { LearningPath } from '@/types';

export const useLearningPaths = (params?: {
  page?: number;
  limit?: number;
  type?: string;
  difficulty?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: ['learning-paths', params],
    queryFn: async () => {
      const response = await learningPathsApi.getLearningPaths(params);
      return response.data.data || { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    },
  });
};

export const useLearningPath = (id: string) => {
  return useQuery({
    queryKey: ['learning-paths', id],
    queryFn: () => learningPathsApi.getLearningPath(id).then(res => res.data.data),
    enabled: !!id,
  });
};

export const useStartLearningPath = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => learningPathsApi.startPath(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['learning-paths', id] });
      queryClient.invalidateQueries({ queryKey: ['learning-paths', 'user'] });
    },
  });
};

export const useGenerateLearningPath = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { targetSkill?: string; goal?: string; currentLevel?: string; learningStyle?: string; timeCommitment?: string; interests?: string[]; [key: string]: any }) => {
      // Map goal to targetSkill if needed, or pass through all data
      const payload = data.goal ? { ...data, targetSkill: data.goal } : data;
      return learningPathsApi.generatePath(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
    },
  });
};

export const useLearningPathProgress = (id: string) => {
  return useQuery({
    queryKey: ['learning-paths', id, 'progress'],
    queryFn: async () => {
      const response = await learningPathsApi.getProgress(id);
      return response.data.data || null;
    },
    enabled: !!id,
  });
};

export const useCanStartLearningPath = (id: string) => {
  return useQuery({
    queryKey: ['learning-paths', id, 'can-start'],
    queryFn: async () => {
      const response = await learningPathsApi.checkCanStart(id);
      return response.data.data || { canStart: false };
    },
    enabled: !!id,
  });
};


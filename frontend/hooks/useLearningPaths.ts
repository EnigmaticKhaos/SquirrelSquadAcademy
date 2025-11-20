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
    mutationFn: (data: { goal: string; learningStyle?: string; timeCommitment?: string; [key: string]: any }) =>
      learningPathsApi.generatePath(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
    },
  });
};


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '@/lib/api';
import type { Challenge, PaginatedResponse } from '@/types';

export const useChallenges = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  isPublic?: boolean;
}) => {
  return useQuery({
    queryKey: ['challenges', params],
    queryFn: async () => {
      const response = await challengesApi.getChallenges(params);
      // Backend returns { success: true, count, total, page, limit, challenges }
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      // If data is not nested, construct paginated response from direct properties
      const page = (apiResponse as any).page || 1;
      const total = (apiResponse as any).total || 0;
      const totalPages = (apiResponse as any).pages || 1;
      return {
        data: (apiResponse as any).challenges || [],
        pagination: {
          page,
          limit: params?.limit || 20,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      } as PaginatedResponse<Challenge>;
    },
    placeholderData: {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    },
  });
};

interface ChallengeDetailResponse {
  challenge: Challenge | null;
  participant: any | null;
  eligibility: any | null;
}

export const useChallenge = (id: string, userId?: string) => {
  return useQuery<ChallengeDetailResponse>({
    queryKey: ['challenge', id, userId],
    queryFn: async (): Promise<ChallengeDetailResponse> => {
      const params = userId ? { userId } : undefined;
      const response = await challengesApi.getChallenge(id, params);
      // Backend returns { success: true, challenge, participant, eligibility }
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      // If data is not nested, return the challenge directly
      return {
        challenge: (apiResponse as any).challenge || null,
        participant: (apiResponse as any).participant || null,
        eligibility: (apiResponse as any).eligibility || null,
      };
    },
    enabled: !!id,
    placeholderData: { challenge: null, participant: null, eligibility: null },
  });
};

export const useJoinChallenge = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => challengesApi.joinChallenge(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['challenge', id] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useLeaveChallenge = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => challengesApi.leaveChallenge(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['challenge', id] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};


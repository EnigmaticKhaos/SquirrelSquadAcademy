import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '@/lib/api';
import type { Submission } from '@/types';

export const useSubmission = (submissionId: string) => {
  return useQuery<Submission | null>({
    queryKey: ['submission', submissionId],
    queryFn: async (): Promise<Submission | null> => {
      try {
        const response = await submissionsApi.getSubmission(submissionId);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data;
        }
        return (apiResponse as any).submission || null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!submissionId,
    placeholderData: null,
  });
};

export const useUserSubmissions = (assignmentId: string) => {
  return useQuery<Submission[]>({
    queryKey: ['submissions', assignmentId],
    queryFn: async (): Promise<Submission[]> => {
      try {
        const response = await submissionsApi.getUserSubmissions(assignmentId);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return (apiResponse.data as any).submissions || [];
        }
        return (apiResponse as any).submissions || [];
      } catch (error: any) {
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!assignmentId,
    placeholderData: [],
  });
};

export const useLatestSubmission = (assignmentId: string) => {
  return useQuery<Submission | null>({
    queryKey: ['latest-submission', assignmentId],
    queryFn: async (): Promise<Submission | null> => {
      return await submissionsApi.getLatestSubmission(assignmentId);
    },
    enabled: !!assignmentId,
    placeholderData: null,
  });
};

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: string; data: Parameters<typeof submissionsApi.submitAssignment>[1] }) => 
      submissionsApi.submitAssignment(assignmentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', variables.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['latest-submission', variables.assignmentId] });
    },
  });
};


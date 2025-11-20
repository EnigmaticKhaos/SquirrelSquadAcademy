import { api } from '../apiClient';
import type { ApiResponse, Submission } from '@/types';

export const submissionsApi = {
  submitAssignment: (assignmentId: string, data: {
    content: string;
    files?: Array<{ name: string; url: string; type: string }>;
    githubRepoUrl?: string;
    githubCommitSha?: string;
  }) => api.post<ApiResponse<Submission>>(`/assignments/${assignmentId}/submit`, data),
  
  getUserSubmissions: (assignmentId: string) => 
    api.get<ApiResponse<{ submissions: Submission[]; count: number }>>(`/assignments/${assignmentId}/submissions`),
  
  getSubmission: (submissionId: string) => 
    api.get<ApiResponse<Submission>>(`/submissions/${submissionId}`),
  
  // Get user's latest submission for an assignment
  getLatestSubmission: async (assignmentId: string): Promise<Submission | null> => {
    try {
      const response = await api.get<ApiResponse<{ submissions: Submission[]; count: number }>>(`/assignments/${assignmentId}/submissions`);
      const apiResponse = response.data;
      const submissions = apiResponse.data ? (apiResponse.data as any).submissions : (apiResponse as any).submissions || [];
      return submissions.length > 0 ? submissions[0] : null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};


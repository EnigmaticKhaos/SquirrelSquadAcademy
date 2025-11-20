import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '@/lib/api';
import type { Assignment } from '@/types';

export const useAssignment = (assignmentId: string) => {
  return useQuery<Assignment | null>({
    queryKey: ['assignment', assignmentId],
    queryFn: async (): Promise<Assignment | null> => {
      try {
        const response = await assignmentsApi.getAssignment(assignmentId);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data;
        }
        return (apiResponse as any).assignment || null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!assignmentId,
    placeholderData: null,
  });
};

export const useAssignments = (lessonId: string) => {
  return useQuery<Assignment[]>({
    queryKey: ['assignments', lessonId],
    queryFn: async (): Promise<Assignment[]> => {
      const response = await assignmentsApi.getAssignments(lessonId);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return (apiResponse.data as any).assignments || [];
      }
      return (apiResponse as any).assignments || [];
    },
    enabled: !!lessonId,
    placeholderData: [],
  });
};


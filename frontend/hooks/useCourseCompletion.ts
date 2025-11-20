import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseCompletionApi, type CourseEnrollment, type CourseProgress } from '@/lib/api';

export const useCourseEnrollment = (courseId: string) => {
  return useQuery<CourseEnrollment | null>({
    queryKey: ['course-enrollment', courseId],
    queryFn: async (): Promise<CourseEnrollment | null> => {
      try {
        const response = await courseCompletionApi.getEnrollment(courseId);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data;
        }
        return (apiResponse as any).completion || null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!courseId,
    placeholderData: null,
  });
};

export const useUserEnrollments = () => {
  return useQuery<CourseEnrollment[]>({
    queryKey: ['user-enrollments'],
    queryFn: async (): Promise<CourseEnrollment[]> => {
      const response = await courseCompletionApi.getUserEnrollments();
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return (apiResponse as any).enrollments || [];
    },
    placeholderData: [],
  });
};

export const useUpdateCourseProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: Parameters<typeof courseCompletionApi.updateProgress>[1] }) => 
      courseCompletionApi.updateProgress(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollment', variables.courseId] });
    },
  });
};

export const useMarkCourseComplete = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (courseId: string) => courseCompletionApi.markComplete(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollment', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
    },
  });
};


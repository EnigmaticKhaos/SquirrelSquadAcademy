import { useQuery } from '@tanstack/react-query';
import { recommendationsApi, type CourseRecommendation, type LearningPathRecommendation } from '@/lib/api/recommendations';

export const useCourseRecommendations = (params?: { limit?: number; excludeEnrolled?: boolean }) => {
  return useQuery({
    queryKey: ['recommendations', 'courses', params],
    queryFn: async (): Promise<CourseRecommendation[]> => {
      const response = await recommendationsApi.getCourseRecommendations(params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return (apiResponse.data as any).recommendations || [];
      }
      return (apiResponse as any).recommendations || [];
    },
    placeholderData: [],
  });
};

export const useLearningPathRecommendations = (params?: { limit?: number }) => {
  return useQuery({
    queryKey: ['recommendations', 'learning-paths', params],
    queryFn: async (): Promise<LearningPathRecommendation[]> => {
      const response = await recommendationsApi.getLearningPathRecommendations(params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return (apiResponse.data as any).recommendations || [];
      }
      return (apiResponse as any).recommendations || [];
    },
    placeholderData: [],
  });
};


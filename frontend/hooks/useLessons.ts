import { useQuery } from '@tanstack/react-query';
import { lessonsApi } from '@/lib/api';
import type { Lesson } from '@/types';

export const useLessons = (moduleId: string) => {
  return useQuery<Lesson[]>({
    queryKey: ['lessons', moduleId],
    queryFn: async (): Promise<Lesson[]> => {
      const response = await lessonsApi.getLessons(moduleId);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return (apiResponse as any).lessons || [];
    },
    enabled: !!moduleId,
    placeholderData: [],
  });
};

export const useLesson = (lessonId: string) => {
  return useQuery<Lesson | null>({
    queryKey: ['lesson', lessonId],
    queryFn: async (): Promise<Lesson | null> => {
      try {
        const response = await lessonsApi.getLesson(lessonId);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data;
        }
        return (apiResponse as any).lesson || null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!lessonId,
    placeholderData: null,
  });
};


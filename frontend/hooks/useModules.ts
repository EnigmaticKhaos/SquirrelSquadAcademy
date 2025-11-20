import { useQuery } from '@tanstack/react-query';
import { modulesApi } from '@/lib/api';
import type { Module } from '@/types';

export const useModules = (courseId: string) => {
  return useQuery<Module[]>({
    queryKey: ['modules', courseId],
    queryFn: async (): Promise<Module[]> => {
      const response = await modulesApi.getModules(courseId);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return (apiResponse as any).modules || [];
    },
    enabled: !!courseId,
    placeholderData: [],
  });
};

export const useModule = (moduleId: string) => {
  return useQuery<Module | null>({
    queryKey: ['module', moduleId],
    queryFn: async (): Promise<Module | null> => {
      try {
        const response = await modulesApi.getModule(moduleId);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data;
        }
        return (apiResponse as any).module || null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!moduleId,
    placeholderData: null,
  });
};


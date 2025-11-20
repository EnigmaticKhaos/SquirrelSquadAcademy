import { api } from '../apiClient';
import type { ApiResponse, Module } from '@/types';

export const modulesApi = {
  getModules: (courseId: string) => 
    api.get<ApiResponse<Module[]>>(`/courses/${courseId}/modules`),
  
  getModule: (moduleId: string) => 
    api.get<ApiResponse<Module>>(`/modules/${moduleId}`),
};


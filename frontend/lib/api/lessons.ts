import { api } from '../apiClient';
import type { ApiResponse, Lesson } from '@/types';

export const lessonsApi = {
  getLessons: (moduleId: string) => 
    api.get<ApiResponse<Lesson[]>>(`/modules/${moduleId}/lessons`),
  
  getLesson: (lessonId: string) => 
    api.get<ApiResponse<Lesson>>(`/lessons/${lessonId}`),
};


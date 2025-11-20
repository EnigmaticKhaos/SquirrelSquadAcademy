import { api } from '../apiClient';
import type { ApiResponse, Assignment } from '@/types';

export const assignmentsApi = {
  getAssignment: (assignmentId: string) => 
    api.get<ApiResponse<Assignment>>(`/assignments/${assignmentId}`),
  
  getAssignments: (lessonId: string) => 
    api.get<ApiResponse<{ assignments: Assignment[]; count: number }>>(`/lessons/${lessonId}/assignments`),
};


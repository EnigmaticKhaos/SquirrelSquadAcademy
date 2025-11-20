import { api } from '../apiClient';
import type { ApiResponse, LearningPath, PaginatedResponse } from '@/types';

export const learningPathsApi = {
  // Get all learning paths
  getLearningPaths: (params?: { page?: number; limit?: number; type?: string; difficulty?: string; category?: string }) =>
    api.get<ApiResponse<PaginatedResponse<LearningPath>>>('/learning-paths', { params }),
  
  // Get single learning path
  getLearningPath: (id: string) => api.get<ApiResponse<LearningPath>>(`/learning-paths/${id}`),
  
  // Get user's learning paths
  getUserPaths: () => api.get<ApiResponse<LearningPath[]>>('/learning-paths/user/paths'),
  
  // Start learning path
  startPath: (id: string) => api.post<ApiResponse<LearningPath>>(`/learning-paths/${id}/start`),
  
  // Get progress
  getProgress: (id: string) => api.get<ApiResponse<any>>(`/learning-paths/${id}/progress`),
  
  // Update progress
  updateProgress: (id: string, data: any) => api.post<ApiResponse<void>>(`/learning-paths/${id}/update-progress`, data),
  
  // Get next course
  getNextCourse: (id: string) => api.get<ApiResponse<any>>(`/learning-paths/${id}/next-course`),
  
  // Check if can start
  checkCanStart: (id: string) => api.get<ApiResponse<{ canStart: boolean; reason?: string }>>(`/learning-paths/${id}/can-start`),
  
  // Toggle status
  toggleStatus: (id: string) => api.post<ApiResponse<LearningPath>>(`/learning-paths/${id}/toggle-status`),
  
  // Generate AI learning path
  generatePath: (data: { targetSkill: string; currentLevel?: string; learningStyle?: string; timeCommitment?: string; interests?: string[] }) =>
    api.post<ApiResponse<{ path: LearningPath }>>('/learning-paths/generate', data),
  
  // Create learning path (admin)
  createPath: (data: Partial<LearningPath>) => api.post<ApiResponse<LearningPath>>('/learning-paths', data),
  
  // Update learning path (admin)
  updatePath: (id: string, data: Partial<LearningPath>) => api.put<ApiResponse<LearningPath>>(`/learning-paths/${id}`, data),
  
  // Delete learning path (admin)
  deletePath: (id: string) => api.delete<ApiResponse<void>>(`/learning-paths/${id}`),
};


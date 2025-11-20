import { api } from '../apiClient';
import type { ApiResponse, Course, LearningPath } from '@/types';

export interface CourseRecommendation {
  course: Course;
  reason: string;
  matchScore: number;
}

export interface LearningPathRecommendation {
  learningPath: LearningPath;
  reason: string;
  matchScore: number;
}

export const recommendationsApi = {
  // Get course recommendations
  getCourseRecommendations: (params?: { limit?: number; excludeEnrolled?: boolean }) =>
    api.get<ApiResponse<{ recommendations: CourseRecommendation[]; count: number }>>('/recommendations/courses', {
      params,
    }),

  // Get learning path recommendations
  getLearningPathRecommendations: (params?: { limit?: number }) =>
    api.get<ApiResponse<{ recommendations: LearningPathRecommendation[]; count: number }>>(
      '/recommendations/learning-paths',
      { params }
    ),
};


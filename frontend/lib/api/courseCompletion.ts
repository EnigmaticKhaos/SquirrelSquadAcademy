import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

export interface CourseEnrollment {
  _id: string;
  user: string;
  course: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  progressPercentage: number;
  completedModules: string[];
  completedLessons: string[];
  completedAssignments: string[];
  timeSpent: number;
  estimatedTimeRemaining?: number;
  lastLesson?: string;
  lastModule?: string;
  finalScore?: number;
  passed: boolean;
  passThreshold?: number;
}

export interface CourseProgress {
  progressPercentage: number;
  completedModules: string[];
  completedLessons: string[];
  completedAssignments: string[];
  totalModules: number;
  totalLessons: number;
  totalAssignments: number;
}

export const courseCompletionApi = {
  getEnrollment: (courseId: string) => 
    api.get<ApiResponse<CourseEnrollment>>(`/course-completion/${courseId}`),
  
  getUserEnrollments: () => 
    api.get<ApiResponse<CourseEnrollment[]>>('/course-completion/user/enrollments'),
  
  updateProgress: (courseId: string, data: {
    lessonId?: string;
    moduleId?: string;
    completed?: boolean;
  }) => api.post<ApiResponse<CourseProgress>>(`/course-completion/${courseId}/update-progress`, data),
  
  markComplete: (courseId: string) => 
    api.post<ApiResponse<CourseEnrollment>>(`/course-completion/${courseId}/complete`),
  
  getAnalytics: (courseId: string) => 
    api.get<ApiResponse<any>>(`/course-completion/${courseId}/analytics`),
};


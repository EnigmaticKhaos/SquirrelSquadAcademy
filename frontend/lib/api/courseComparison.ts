import { api } from '../apiClient';
import type { ApiResponse, Course } from '@/types';

export interface CourseComparisonItem {
  course: {
    _id: string;
    title: string;
    description: string;
    courseType: string;
    difficulty: string;
    estimatedDuration: number;
    tags: string[];
    category?: string;
    thumbnail?: string;
    isFree: boolean;
    price?: number;
    currency?: string;
  };
  statistics: {
    enrollmentCount: number;
    completionCount: number;
    passCount: number;
    reviewCount: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    averageDifficulty: number | null;
    completionRate: number;
    totalModules: number;
    totalLessons: number;
    totalAssignments: number;
  };
}

export interface CourseComparisonResponse {
  courses: CourseComparisonItem[];
  metrics: {
    cheapest: CourseComparisonItem;
    mostRated: CourseComparisonItem;
    highestRated: CourseComparisonItem;
    highestCompletionRate: CourseComparisonItem;
    longest: CourseComparisonItem;
    shortest: CourseComparisonItem;
  };
}

export interface ComparisonSummary {
  totalCourses: number;
  priceRange: {
    min: number;
    max: number;
    freeCount: number;
  };
  ratingRange: {
    min: number;
    max: number;
  };
  durationRange: {
    min: number;
    max: number;
  };
  totalEnrollments: number;
  totalReviews: number;
  courseTypes: string[];
  difficulties: string[];
  categories: string[];
}

export const courseComparisonApi = {
  /**
   * Compare multiple courses (2-5 courses)
   */
  compareCourses: (courseIds: string[]) =>
    api.post<ApiResponse<CourseComparisonResponse>>('/course-comparison', { courseIds }),

  /**
   * Get comparison summary
   */
  getComparisonSummary: (courseIds: string[]) =>
    api.post<ApiResponse<{ comparison: CourseComparisonResponse; summary: ComparisonSummary }>>('/course-comparison/summary', { courseIds }),
};


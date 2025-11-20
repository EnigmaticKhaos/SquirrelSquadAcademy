import { useMutation } from '@tanstack/react-query';
import { courseComparisonApi, type CourseComparisonResponse, type ComparisonSummary } from '@/lib/api/courseComparison';
import { showToast, getErrorMessage } from '@/lib/toast';

export const useCompareCourses = () => {
  return useMutation({
    mutationFn: async (courseIds: string[]) => {
      if (courseIds.length < 2) {
        throw new Error('At least 2 courses are required for comparison');
      }
      if (courseIds.length > 5) {
        throw new Error('Maximum 5 courses can be compared at once');
      }
      const response = await courseComparisonApi.compareCourses(courseIds);
      return response.data;
    },
    onError: (error) => {
      showToast.error('Failed to compare courses', getErrorMessage(error));
    },
  });
};

export const useComparisonSummary = () => {
  return useMutation({
    mutationFn: async (courseIds: string[]) => {
      if (courseIds.length < 2) {
        throw new Error('At least 2 courses are required for comparison');
      }
      const response = await courseComparisonApi.getComparisonSummary(courseIds);
      return response.data?.summary || response.data;
    },
    onError: (error) => {
      showToast.error('Failed to get comparison summary', getErrorMessage(error));
    },
  });
};


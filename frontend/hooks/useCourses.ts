import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api';
import type { Course, PaginatedResponse } from '@/types';

export const useCourses = (params?: {
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: string;
  courseType?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: async () => {
      const response = await coursesApi.getCourses(params);
      return response.data.data || { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    },
  });
};

export const useCourse = (id: string) => {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesApi.getCourse(id).then(res => res.data.data),
    enabled: !!id,
  });
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => coursesApi.enrollInCourse(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['courses', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};


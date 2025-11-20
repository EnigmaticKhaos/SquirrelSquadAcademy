import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collaborativeProjectsApi } from '@/lib/api';
import type { CollaborativeProject } from '@/types';

export const useCollaborativeProjects = (params?: { page?: number; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ['collaborative-projects', params],
    queryFn: () => collaborativeProjectsApi.getProjects(params).then(res => res.data.data),
  });
};

export const useCollaborativeProject = (id: string) => {
  return useQuery({
    queryKey: ['collaborative-projects', id],
    queryFn: () => collaborativeProjectsApi.getProject(id).then(res => res.data.data?.project),
    enabled: !!id,
  });
};

export const useCreateCollaborativeProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      courseId?: string;
      assignmentId?: string;
      maxMembers?: number;
      settings?: any;
    }) => collaborativeProjectsApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborative-projects'] });
    },
  });
};

export const useUpdateCollaborativeProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CollaborativeProject> }) =>
      collaborativeProjectsApi.updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborative-projects', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['collaborative-projects'] });
    },
  });
};

export const useJoinCollaborativeProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => collaborativeProjectsApi.joinProject(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['collaborative-projects', id] });
      queryClient.invalidateQueries({ queryKey: ['collaborative-projects'] });
    },
  });
};

export const useAddProjectTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: {
        title: string;
        description?: string;
        assignedTo?: string;
        priority?: 'low' | 'medium' | 'high';
        dueDate?: string;
      };
    }) => collaborativeProjectsApi.addTask(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborative-projects', variables.id] });
    },
  });
};


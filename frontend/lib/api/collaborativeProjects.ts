'use client';

import { api } from '../apiClient';
import type { ApiResponse, CollaborativeProject, PaginatedResponse } from '@/types';

export const collaborativeProjectsApi = {
  // Get all collaborative projects
  getProjects: (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    return api.get<ApiResponse<PaginatedResponse<CollaborativeProject>>>(
      `/projects/collaborative?${queryParams.toString()}`
    );
  },
  
  // Get project by ID
  getProject: (id: string) =>
    api.get<ApiResponse<{ project: CollaborativeProject }>>(`/projects/collaborative/${id}`),
  
  // Create new project
  createProject: (data: {
    title: string;
    description: string;
    courseId?: string;
    assignmentId?: string;
    maxMembers?: number;
    settings?: any;
  }) => api.post<ApiResponse<{ project: CollaborativeProject }>>('/projects/collaborative', data),
  
  // Update project
  updateProject: (id: string, data: Partial<CollaborativeProject>) =>
    api.put<ApiResponse<{ project: CollaborativeProject }>>(`/projects/collaborative/${id}`, data),
  
  // Invite user to project
  inviteUser: (id: string, userId: string) =>
    api.post<ApiResponse<void>>(`/projects/collaborative/${id}/invite`, { userId }),
  
  // Join project
  joinProject: (id: string) =>
    api.post<ApiResponse<void>>(`/projects/collaborative/${id}/join`),
  
  // Leave project
  leaveProject: (id: string) =>
    api.post<ApiResponse<void>>(`/projects/collaborative/${id}/leave`),
  
  // Add task
  addTask: (id: string, data: {
    title: string;
    description?: string;
    assignedTo?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
  }) => api.post<ApiResponse<void>>(`/projects/collaborative/${id}/tasks`, data),
  
  // Update task
  updateTask: (id: string, taskId: string, data: {
    title?: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'completed' | 'review';
    priority?: 'low' | 'medium' | 'high';
    assignedTo?: string;
    dueDate?: string;
  }) => api.put<ApiResponse<void>>(`/projects/collaborative/${id}/tasks/${taskId}`, data),
  
  // Add discussion message
  addDiscussion: (id: string, content: string) =>
    api.post<ApiResponse<void>>(`/projects/collaborative/${id}/discussion`, { content }),
  
  // Add resource
  addResource: (id: string, data: { name: string; url: string; type: string }) =>
    api.post<ApiResponse<void>>(`/projects/collaborative/${id}/resources`, data),
  
  // Submit deliverable
  submitDeliverable: (id: string, data: { title: string; description: string; files?: File[] }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.files) {
      data.files.forEach((file) => formData.append('files', file));
    }
    return api.post<ApiResponse<void>>(`/projects/collaborative/${id}/deliverables`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};


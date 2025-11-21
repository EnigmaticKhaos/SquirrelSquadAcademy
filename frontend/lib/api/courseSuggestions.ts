import { api } from '../apiClient';
import type { ApiResponse, Course } from '@/types';

// Types
export type SuggestionStatus = 'pending' | 'approved' | 'denied';

export interface CourseSuggestion {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  title: string;
  description: string;
  desiredContent?: string;
  votes: Array<{
    user: string;
    createdAt: string;
  }>;
  voteCount: number;
  status: SuggestionStatus;
  reviewedBy?: {
    _id: string;
    username: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  generatedCourse?: string | Course;
  createdAt: string;
  updatedAt: string;
  hasVoted?: boolean; // Client-side computed
}

export interface CreateSuggestionData {
  title: string;
  description: string;
  desiredContent?: string;
}

// API Client
export const courseSuggestionsApi = {
  // Get all suggestions
  getSuggestions: (params?: {
    status?: SuggestionStatus;
    sort?: 'voteCount' | 'createdAt';
  }) => api.get<ApiResponse<{ count: number; suggestions: CourseSuggestion[] }>>('/course-suggestions', { params }),
  
  // Create suggestion
  createSuggestion: (data: CreateSuggestionData) =>
    api.post<ApiResponse<{ suggestion: CourseSuggestion; message: string }>>('/course-suggestions', data),
  
  // Vote on suggestion
  voteOnSuggestion: (id: string) =>
    api.post<ApiResponse<{ suggestion: CourseSuggestion; message: string }>>(`/course-suggestions/${id}/vote`),
  
  // Approve suggestion (Admin)
  approveSuggestion: (id: string) =>
    api.post<ApiResponse<{ suggestion: CourseSuggestion; course?: Course; message: string }>>(`/course-suggestions/${id}/approve`),
  
  // Deny suggestion (Admin)
  denySuggestion: (id: string, reviewNotes?: string) =>
    api.post<ApiResponse<{ suggestion: CourseSuggestion; message: string }>>(`/course-suggestions/${id}/deny`, { reviewNotes }),
};


import { api } from '../apiClient';
import type {
  ApiResponse,
  MentorSuggestion,
  Mentorship,
  MentorshipRequest,
  MentorshipStatus,
  MentorshipRequestStatus,
  MentorshipCommunicationMethod,
  MentorshipMeetingFrequency,
} from '@/types';

export interface MentorshipQueryParams {
  role?: 'mentor' | 'mentee';
  status?: MentorshipStatus;
  limit?: number;
  offset?: number;
}

export interface MentorshipRequestQueryParams {
  type?: 'incoming' | 'outgoing';
  status?: MentorshipRequestStatus;
  limit?: number;
  offset?: number;
}

export interface MentorshipRequestPayload {
  mentorId: string;
  message?: string;
  goals?: string[];
  preferredCommunicationMethod?: MentorshipCommunicationMethod;
  expectedDuration?: number;
}

export interface MentorshipSessionPayload {
  date: string;
  duration?: number;
  notes?: string;
  goalsDiscussed?: string[];
  nextSteps?: string[];
  rating?: number;
  feedback?: string;
}

export interface MentorshipMilestonePayload {
  title: string;
  description?: string;
  targetDate?: string;
}

export const mentorshipApi = {
  getMentorships: (params?: MentorshipQueryParams) =>
    api.get<ApiResponse<{ mentorships: Mentorship[]; total: number }>>('/mentorship', { params }),

  getMentorship: (id: string) => api.get<ApiResponse<{ mentorship: Mentorship }>>(`/mentorship/${id}`),

  getRequests: (params?: MentorshipRequestQueryParams) =>
    api.get<ApiResponse<{ requests: MentorshipRequest[]; total: number }>>('/mentorship/requests', {
      params,
    }),

  createRequest: (data: MentorshipRequestPayload) =>
    api.post<ApiResponse<{ request: MentorshipRequest }>>('/mentorship/requests', data),

  respondToRequest: (id: string, accept: boolean) =>
    api.put<ApiResponse<{ result: Mentorship | MentorshipRequest }>>(
      `/mentorship/requests/${id}/respond`,
      { accept }
    ),

  findMentors: (params?: { courseId?: string; limit?: number }) =>
    api.get<ApiResponse<{ mentors: MentorSuggestion[] }>>('/mentorship/find-mentors', { params }),

  addSession: (id: string, data: MentorshipSessionPayload) =>
    api.post<ApiResponse<{ mentorship: Mentorship }>>(`/mentorship/${id}/sessions`, data),

  addMilestone: (id: string, data: MentorshipMilestonePayload) =>
    api.post<ApiResponse<{ mentorship: Mentorship }>>(`/mentorship/${id}/milestones`, data),

  completeMilestone: (id: string, milestoneId: string, notes?: string) =>
    api.put<ApiResponse<{ mentorship: Mentorship }>>(
      `/mentorship/${id}/milestones/${milestoneId}/complete`,
      { notes }
    ),

  completeMentorship: (id: string, data?: { rating?: number; feedback?: string }) =>
    api.post<ApiResponse<{ mentorship: Mentorship }>>(`/mentorship/${id}/complete`, data),
};


'use client';

import { api } from '../apiClient';
import type {
  ApiResponse,
  Mentorship,
  MentorshipRequest,
  MentorshipStatus,
  MentorshipRequestStatus,
  PotentialMentor,
} from '@/types';

export interface MentorshipListParams {
  role?: 'mentor' | 'mentee';
  status?: MentorshipStatus;
  limit?: number;
  offset?: number;
}

export interface MentorshipRequestParams {
  type?: 'incoming' | 'outgoing';
  status?: MentorshipRequestStatus;
  limit?: number;
  offset?: number;
}

export const mentorshipApi = {
  findMentors: (params?: { courseId?: string; limit?: number }) =>
    api.get<ApiResponse<{ mentors: PotentialMentor[]; count: number }>>('/mentorship/find-mentors', {
      params,
    }),

  getMentorships: (params?: MentorshipListParams) =>
    api.get<ApiResponse<{ mentorships: Mentorship[]; total: number }>>('/mentorship', {
      params,
    }),

  getMentorship: (id: string) => api.get<ApiResponse<{ mentorship: Mentorship }>>(`/mentorship/${id}`),

  getRequests: (params?: MentorshipRequestParams) =>
    api.get<ApiResponse<{ requests: MentorshipRequest[]; total: number }>>('/mentorship/requests', {
      params,
    }),

  sendRequest: (payload: {
    mentorId: string;
    message?: string;
    goals?: string[];
    preferredCommunicationMethod?: 'message' | 'video' | 'both';
    expectedDuration?: number;
  }) => api.post<ApiResponse<{ request: MentorshipRequest }>>('/mentorship/requests', payload),

  respondToRequest: (requestId: string, accept: boolean) =>
    api.put<ApiResponse<{ result: Mentorship | MentorshipRequest }>>(`/mentorship/requests/${requestId}/respond`, {
      accept,
    }),

  addSession: (
    mentorshipId: string,
    payload: {
      date: string;
      duration?: number;
      notes?: string;
      goalsDiscussed?: string[];
      nextSteps?: string[];
      rating?: number;
      feedback?: string;
    }
  ) => api.post<ApiResponse<{ mentorship: Mentorship }>>(`/mentorship/${mentorshipId}/sessions`, payload),

  addMilestone: (
    mentorshipId: string,
    payload: { title: string; description?: string; targetDate?: string }
  ) => api.post<ApiResponse<{ mentorship: Mentorship }>>(`/mentorship/${mentorshipId}/milestones`, payload),

  completeMilestone: (mentorshipId: string, milestoneId: string, notes?: string) =>
    api.put<ApiResponse<{ mentorship: Mentorship }>>(
      `/mentorship/${mentorshipId}/milestones/${milestoneId}/complete`,
      { notes }
    ),

  completeMentorship: (mentorshipId: string, payload?: { rating?: number; feedback?: string }) =>
    api.post<ApiResponse<{ mentorship: Mentorship }>>(`/mentorship/${mentorshipId}/complete`, payload),
};

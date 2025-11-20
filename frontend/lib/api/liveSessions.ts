'use client';

import { api } from '../apiClient';
import type {
  ApiResponse,
  LiveSession,
  LiveSessionParticipant,
} from '@/types';

export const liveSessionsApi = {
  getSessions: (params?: {
    status?: string;
    type?: string;
    courseId?: string;
    upcoming?: boolean;
    past?: boolean;
  }) =>
    api.get<ApiResponse<{ sessions: LiveSession[] }>>('/live-sessions', {
      params: {
        ...params,
        upcoming: params?.upcoming ? 'true' : undefined,
        past: params?.past ? 'true' : undefined,
      },
    }),

  getSession: (id: string) =>
    api.get<ApiResponse<{ session: LiveSession; participant?: LiveSessionParticipant }>>(
      `/live-sessions/${id}`
    ),

  register: (id: string) => api.post<ApiResponse<{ session: LiveSession }>>(`/live-sessions/${id}/register`),

  join: (id: string) =>
    api.post<ApiResponse<{ session: LiveSession; participant: LiveSessionParticipant }>>(
      `/live-sessions/${id}/join`
    ),

  leave: (id: string) => api.post<ApiResponse<{ message: string }>>(`/live-sessions/${id}/leave`),

  end: (id: string) => api.post<ApiResponse<{ session: LiveSession }>>(`/live-sessions/${id}/end`),

  getParticipants: (id: string) =>
    api.get<ApiResponse<{ participants: LiveSessionParticipant[] }>>(`/live-sessions/${id}/participants`),
};

'use client';

import { api } from '../apiClient';
import type { ApiResponse, MentorApplication } from '@/types';

export interface MentorApplicationPayload {
  motivation: string;
  specialties: string[];
  experience: string;
  availability?: {
    hoursPerWeek?: number;
    timezone?: string;
    preferredTimes?: string[];
  };
  maxMentees?: number;
}

export const mentorApplicationsApi = {
  submit: (payload: MentorApplicationPayload) =>
    api.post<ApiResponse<{ application: MentorApplication }>>('/mentor-applications', payload),

  getMyApplication: () => api.get<ApiResponse<{ application: MentorApplication | null }>>('/mentor-applications/my-application'),

  updateAvailability: (payload: { isAvailable: boolean; hoursPerWeek?: number; timezone?: string }) =>
    api.put<ApiResponse<{ message: string }>>('/mentor-applications/availability', payload),
};

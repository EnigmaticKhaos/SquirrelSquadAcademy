import { api } from '../apiClient';
import type { ApiResponse, MentorApplication } from '@/types';

export interface MentorApplicationPayload {
  motivation: string;
  specialties: string[];
  experience?: string;
  availability?: {
    hoursPerWeek?: number;
    timezone?: string;
    preferredTimes?: string[];
  };
  maxMentees?: number;
}

export const mentorApplicationsApi = {
  getMyApplication: () =>
    api.get<ApiResponse<{ application: MentorApplication }>>('/mentor-applications/my-application'),

  submitApplication: (data: MentorApplicationPayload) =>
    api.post<ApiResponse<{ application: MentorApplication }>>('/mentor-applications', data),

  updateAvailability: (isAvailable: boolean) =>
    api.put<ApiResponse<{ message: string }>>('/mentor-applications/availability', { isAvailable }),
};


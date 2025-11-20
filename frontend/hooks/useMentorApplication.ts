import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mentorApplicationsApi } from '@/lib/api';
import type { MentorApplication } from '@/types';
import type { MentorApplicationPayload } from '@/lib/api/mentorApplications';

export const useMentorApplication = () => {
  return useQuery<MentorApplication | null>({
    queryKey: ['mentor-application'],
    queryFn: async () => {
      try {
        const response = await mentorApplicationsApi.getMyApplication();
        const payload = response.data;
        if (payload.data) {
          return (payload.data as { application: MentorApplication }).application;
        }
        return (payload as any).application as MentorApplication;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    placeholderData: null,
  });
};

export const useSubmitMentorApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MentorApplicationPayload) => mentorApplicationsApi.submitApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-application'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};

export const useUpdateMentorAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isAvailable: boolean) => mentorApplicationsApi.updateAvailability(isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};


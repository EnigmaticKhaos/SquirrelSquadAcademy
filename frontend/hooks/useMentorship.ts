'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mentorshipApi, mentorApplicationsApi, MentorshipListParams, MentorshipRequestParams } from '@/lib/api';
import type {
  Mentorship,
  MentorshipRequest,
  PotentialMentor,
} from '@/types';

export const useMentorApplication = () => {
  return useQuery({
    queryKey: ['mentor-application'],
    queryFn: async () => {
      const response = await mentorApplicationsApi.getMyApplication();
      return response.data?.application ?? null;
    },
  });
};

export const useSubmitMentorApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorApplicationsApi.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-application'] });
    },
  });
};

export const usePotentialMentors = (params?: { courseId?: string; limit?: number }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['mentorship', 'mentors', params],
    queryFn: async (): Promise<PotentialMentor[]> => {
      const response = await mentorshipApi.findMentors(params);
      return response.data?.mentors ?? [];
    },
    enabled: options?.enabled ?? true,
  });
};

export const useMentorships = (params?: MentorshipListParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['mentorship', 'list', params],
    queryFn: async (): Promise<Mentorship[]> => {
      const response = await mentorshipApi.getMentorships(params);
      return response.data?.mentorships ?? [];
    },
    enabled: options?.enabled ?? true,
  });
};

export const useMentorshipRequests = (params?: MentorshipRequestParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['mentorship', 'requests', params],
    queryFn: async (): Promise<MentorshipRequest[]> => {
      const response = await mentorshipApi.getRequests(params);
      return response.data?.requests ?? [];
    },
    enabled: options?.enabled ?? true,
  });
};

export const useSendMentorshipRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorshipApi.sendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'requests'] });
    },
  });
};

export const useRespondToMentorshipRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      mentorshipApi.respondToRequest(requestId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'list'] });
    },
  });
};

export const useMentorshipDetail = (id?: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['mentorship', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await mentorshipApi.getMentorship(id);
      return response.data?.mentorship ?? null;
    },
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
};

export const useAddMentorshipSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mentorshipId,
      payload,
    }: {
      mentorshipId: string;
      payload: {
        date: string;
        duration?: number;
        notes?: string;
        goalsDiscussed?: string[];
        nextSteps?: string[];
        rating?: number;
        feedback?: string;
      };
    }) => mentorshipApi.addSession(mentorshipId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentorship', variables.mentorshipId] });
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'list'] });
    },
  });
};

export const useCompleteMentorship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mentorshipId,
      payload,
    }: {
      mentorshipId: string;
      payload?: { rating?: number; feedback?: string };
    }) => mentorshipApi.completeMentorship(mentorshipId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentorship', variables.mentorshipId] });
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'list'] });
    },
  });
};

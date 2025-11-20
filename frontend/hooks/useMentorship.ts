import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mentorshipApi } from '@/lib/api';
import type {
  MentorSuggestion,
  Mentorship,
  MentorshipRequest,
} from '@/types';
import type {
  MentorshipMilestonePayload,
  MentorshipQueryParams,
  MentorshipRequestPayload,
  MentorshipRequestQueryParams,
  MentorshipSessionPayload,
} from '@/lib/api/mentorship';

interface MentorshipListResponse {
  mentorships: Mentorship[];
  total: number;
}

interface MentorshipRequestListResponse {
  requests: MentorshipRequest[];
  total: number;
}

export const useMentorships = (params?: MentorshipQueryParams) => {
  return useQuery<MentorshipListResponse>({
    queryKey: ['mentorships', params],
    queryFn: async () => {
      const response = await mentorshipApi.getMentorships(params);
      const payload = response.data;
      if (payload.data) {
        return payload.data as MentorshipListResponse;
      }
      return {
        mentorships: (payload as any).mentorships || [],
        total: (payload as any).total || 0,
      };
    },
    placeholderData: { mentorships: [], total: 0 },
  });
};

export const useMentorship = (id?: string) => {
  return useQuery<Mentorship | null>({
    queryKey: ['mentorship', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      const response = await mentorshipApi.getMentorship(id);
      const payload = response.data;
      if (payload.data) {
        return (payload.data as { mentorship: Mentorship }).mentorship;
      }
      return (payload as any).mentorship as Mentorship;
    },
    placeholderData: null,
  });
};

export const useMentorshipRequests = (params?: MentorshipRequestQueryParams) => {
  return useQuery<MentorshipRequestListResponse>({
    queryKey: ['mentorship-requests', params],
    queryFn: async () => {
      const response = await mentorshipApi.getRequests(params);
      const payload = response.data;
      if (payload.data) {
        return payload.data as MentorshipRequestListResponse;
      }
      return {
        requests: (payload as any).requests || [],
        total: (payload as any).total || 0,
      };
    },
    placeholderData: { requests: [], total: 0 },
  });
};

export const useMentorSuggestions = (params?: { courseId?: string; limit?: number }) => {
  return useQuery<MentorSuggestion[]>({
    queryKey: ['mentorship-mentors', params],
    queryFn: async () => {
      const response = await mentorshipApi.findMentors(params);
      const payload = response.data;
      if (payload.data) {
        return (payload.data as { mentors: MentorSuggestion[] }).mentors;
      }
      return (payload as any).mentors || [];
    },
    placeholderData: [],
  });
};

const invalidateMentorshipQueries = (queryClient: ReturnType<typeof useQueryClient>, id?: string) => {
  queryClient.invalidateQueries({ queryKey: ['mentorships'] });
  queryClient.invalidateQueries({ queryKey: ['mentorship-requests'] });
  if (id) {
    queryClient.invalidateQueries({ queryKey: ['mentorship', id] });
  }
};

export const useCreateMentorshipRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MentorshipRequestPayload) => mentorshipApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-requests'] });
      queryClient.invalidateQueries({ queryKey: ['mentorship-mentors'] });
    },
  });
};

export const useRespondMentorshipRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      mentorshipApi.respondToRequest(id, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-requests'] });
      queryClient.invalidateQueries({ queryKey: ['mentorships'] });
    },
  });
};

export const useAddMentorshipSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MentorshipSessionPayload }) =>
      mentorshipApi.addSession(id, data),
    onSuccess: (_, variables) => {
      invalidateMentorshipQueries(queryClient, variables.id);
    },
  });
};

export const useAddMentorshipMilestone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MentorshipMilestonePayload }) =>
      mentorshipApi.addMilestone(id, data),
    onSuccess: (_, variables) => {
      invalidateMentorshipQueries(queryClient, variables.id);
    },
  });
};

export const useCompleteMentorshipMilestone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, milestoneId, notes }: { id: string; milestoneId: string; notes?: string }) =>
      mentorshipApi.completeMilestone(id, milestoneId, notes),
    onSuccess: (_, variables) => {
      invalidateMentorshipQueries(queryClient, variables.id);
    },
  });
};

export const useCompleteMentorship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { rating?: number; feedback?: string } }) =>
      mentorshipApi.completeMentorship(id, data),
    onSuccess: (_, variables) => {
      invalidateMentorshipQueries(queryClient, variables.id);
    },
  });
};


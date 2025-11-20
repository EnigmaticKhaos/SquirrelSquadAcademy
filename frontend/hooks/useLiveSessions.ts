'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liveSessionsApi } from '@/lib/api';
import type { LiveSessionParticipant } from '@/types';

export const useLiveSessions = (
  params?: {
    status?: string;
    type?: string;
    courseId?: string;
    upcoming?: boolean;
    past?: boolean;
  },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['live-sessions', params],
    queryFn: async () => {
      const response = await liveSessionsApi.getSessions(params);
      return response.data?.sessions ?? [];
    },
    enabled: options?.enabled ?? true,
  });
};

export const useLiveSession = (sessionId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['live-session', sessionId],
    queryFn: async () => {
      const response = await liveSessionsApi.getSession(sessionId);
      return response.data ?? { session: null, participant: null };
    },
    enabled: options?.enabled ?? Boolean(sessionId),
  });
};

export const useRegisterForSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => liveSessionsApi.register(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['live-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
    },
  });
};

export const useJoinSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => liveSessionsApi.join(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['live-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
    },
  });
};

export const useLeaveSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => liveSessionsApi.leave(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['live-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
    },
  });
};

export const useSessionParticipants = (sessionId: string, options?: { enabled?: boolean }) => {
  return useQuery<LiveSessionParticipant[]>({
    queryKey: ['live-session', sessionId, 'participants'],
    queryFn: async () => {
      const response = await liveSessionsApi.getParticipants(sessionId);
      return response.data?.participants ?? [];
    },
    enabled: options?.enabled ?? Boolean(sessionId),
  });
};

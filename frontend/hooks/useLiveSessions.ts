import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { liveSessionsApi } from '@/lib/api';
import type {
  LiveSession,
  LiveSessionParticipant,
  LiveSessionPoll,
  LiveSessionQuestion,
  LiveSessionRecording,
} from '@/types';
import type {
  AnswerQuestionPayload,
  AskQuestionPayload,
  CreateLiveSessionPayload,
  CreatePollPayload,
  LiveSessionFilters,
  UpdateLiveSessionPayload,
  VotePollPayload,
} from '@/lib/api/liveSessions';

export const useLiveSessions = (filters?: LiveSessionFilters) => {
  return useQuery<LiveSession[]>({
    queryKey: ['live-sessions', filters],
    queryFn: async () => {
      const response = await liveSessionsApi.getSessions(filters);
      const payload = response.data;
      if (payload.data) {
        return (payload.data as { sessions: LiveSession[] }).sessions;
      }
      return (payload as any).sessions || [];
    },
    placeholderData: [],
  });
};

export const useLiveSession = (id?: string) => {
  return useQuery<{ session: LiveSession; participant?: LiveSessionParticipant } | null>({
    queryKey: ['live-session', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      const response = await liveSessionsApi.getSession(id);
      const payload = response.data;
      if (payload.data) {
        return payload.data as { session: LiveSession; participant?: LiveSessionParticipant };
      }
      return {
        session: (payload as any).session as LiveSession,
        participant: (payload as any).participant,
      };
    },
    placeholderData: null,
  });
};

const invalidateSessionQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  sessionId?: string
) => {
  queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
  if (sessionId) {
    queryClient.invalidateQueries({ queryKey: ['live-session', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['live-session-participants', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['live-session-polls', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['live-session-questions', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['live-session-recording', sessionId] });
  }
};

export const useCreateLiveSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLiveSessionPayload) => liveSessionsApi.createSession(data),
    onSuccess: () => invalidateSessionQueries(queryClient),
  });
};

export const useUpdateLiveSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLiveSessionPayload }) =>
      liveSessionsApi.updateSession(id, data),
    onSuccess: (_, variables) => invalidateSessionQueries(queryClient, variables.id),
  });
};

export const useRegisterLiveSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveSessionsApi.registerSession(id),
    onSuccess: (_, id) => invalidateSessionQueries(queryClient, id),
  });
};

export const useJoinLiveSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveSessionsApi.joinSession(id),
    onSuccess: (_, id) => invalidateSessionQueries(queryClient, id),
  });
};

export const useLeaveLiveSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveSessionsApi.leaveSession(id),
    onSuccess: (_, id) => invalidateSessionQueries(queryClient, id),
  });
};

export const useEndLiveSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveSessionsApi.endSession(id),
    onSuccess: (_, id) => invalidateSessionQueries(queryClient, id),
  });
};

export const useLiveSessionParticipants = (sessionId?: string) => {
  return useQuery<LiveSessionParticipant[]>({
    queryKey: ['live-session-participants', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await liveSessionsApi.getParticipants(sessionId);
      const payload = response.data;
      if (payload.data) {
        return (payload.data as { participants: LiveSessionParticipant[] }).participants;
      }
      return (payload as any).participants || [];
    },
    placeholderData: [],
  });
};

export const useLiveSessionPolls = (sessionId?: string, options?: { active?: boolean }) => {
  return useQuery<LiveSessionPoll[]>({
    queryKey: ['live-session-polls', sessionId, options],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await liveSessionsApi.getPolls(sessionId, options);
      const payload = response.data;
      if (payload.data) {
        return (payload.data as { polls: LiveSessionPoll[] }).polls;
      }
      return (payload as any).polls || [];
    },
    placeholderData: [],
  });
};

export const useCreateLiveSessionPoll = (sessionId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePollPayload) => {
      if (!sessionId) {
        return Promise.reject(new Error('Session ID is required'));
      }
      return liveSessionsApi.createPoll(sessionId, data);
    },
    onSuccess: (_, __, context) => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['live-session-polls', sessionId] });
      }
    },
  });
};

export const useVoteLiveSessionPoll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, data }: { pollId: string; data: VotePollPayload }) =>
      liveSessionsApi.votePoll(pollId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-session-polls'] });
    },
  });
};

export const useLiveSessionQuestions = (
  sessionId?: string,
  params?: { status?: string; answered?: boolean }
) => {
  return useQuery<LiveSessionQuestion[]>({
    queryKey: ['live-session-questions', sessionId, params],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await liveSessionsApi.getQuestions(sessionId, params);
      const payload = response.data;
      if (payload.data) {
        return (payload.data as { questions: LiveSessionQuestion[] }).questions;
      }
      return (payload as any).questions || [];
    },
    placeholderData: [],
  });
};

export const useAskLiveSessionQuestion = (sessionId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AskQuestionPayload) => {
      if (!sessionId) {
        return Promise.reject(new Error('Session ID is required'));
      }
      return liveSessionsApi.askQuestion(sessionId, data);
    },
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['live-session-questions', sessionId] });
      }
    },
  });
};

export const useAnswerLiveSessionQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: AnswerQuestionPayload }) =>
      liveSessionsApi.answerQuestion(questionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['live-session-questions'] });
      if (variables.questionId) {
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => queryKey.includes('live-session-questions'),
        });
      }
    },
  });
};

export const useUpvoteLiveSessionQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => liveSessionsApi.upvoteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-session-questions'] });
    },
  });
};

export const useLiveSessionRecording = (sessionId?: string) => {
  return useQuery<LiveSessionRecording | null>({
    queryKey: ['live-session-recording', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      if (!sessionId) return null;
      try {
        const response = await liveSessionsApi.getRecording(sessionId);
        const payload = response.data;
        if (payload.data) {
          return (payload.data as { recording: LiveSessionRecording }).recording;
        }
        return (payload as any).recording || null;
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

export const useSaveLiveSessionRecording = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { recordingUrl: string; thumbnailUrl?: string; duration: number };
    }) => liveSessionsApi.saveRecording(id, data),
    onSuccess: (_, variables) => {
      invalidateSessionQueries(queryClient, variables.id);
    },
  });
};


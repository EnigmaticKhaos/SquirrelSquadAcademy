import { api } from '../apiClient';
import type {
  ApiResponse,
  LiveSession,
  LiveSessionParticipant,
  LiveSessionPoll,
  LiveSessionQuestion,
  LiveSessionRecording,
  LiveSessionStatus,
  LiveSessionType,
} from '@/types';

export interface LiveSessionFilters {
  status?: LiveSessionStatus;
  sessionType?: LiveSessionType | string;
  courseId?: string;
  upcoming?: boolean;
  past?: boolean;
}

export interface CreateLiveSessionPayload {
  title: string;
  description?: string;
  sessionType: LiveSessionType;
  scheduledStartTime: string;
  scheduledEndTime?: string;
  provider?: 'webrtc' | 'zoom' | 'custom';
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  streamUrl?: string;
  course?: string;
  lesson?: string;
  maxParticipants?: number;
  allowRecording?: boolean;
  requireRegistration?: boolean;
  isPublic?: boolean;
  allowQuestions?: boolean;
  allowPolls?: boolean;
  allowScreenShare?: boolean;
  allowChat?: boolean;
  registrationDeadline?: string;
  coHosts?: string[];
}

export interface UpdateLiveSessionPayload extends Partial<CreateLiveSessionPayload> {}

export interface CreatePollPayload {
  question: string;
  options: string[];
  isMultipleChoice?: boolean;
  isAnonymous?: boolean;
  duration?: number;
}

export interface VotePollPayload {
  selectedOptions: string[];
}

export interface AskQuestionPayload {
  question: string;
}

export interface AnswerQuestionPayload {
  answer: string;
}

export const liveSessionsApi = {
  getSessions: (params?: LiveSessionFilters) =>
    api.get<ApiResponse<{ sessions: LiveSession[] }>>('/live-sessions', {
      params: {
        status: params?.status,
        type: params?.sessionType,
        courseId: params?.courseId,
        upcoming: params?.upcoming ? 'true' : undefined,
        past: params?.past ? 'true' : undefined,
      },
    }),

  getSession: (id: string) =>
    api.get<ApiResponse<{ session: LiveSession; participant?: LiveSessionParticipant }>>(
      `/live-sessions/${id}`
    ),

  createSession: (data: CreateLiveSessionPayload) =>
    api.post<ApiResponse<{ session: LiveSession }>>('/live-sessions', data),

  updateSession: (id: string, data: UpdateLiveSessionPayload) =>
    api.put<ApiResponse<{ session: LiveSession }>>(`/live-sessions/${id}`, data),

  registerSession: (id: string) =>
    api.post<ApiResponse<{ session: LiveSession }>>(`/live-sessions/${id}/register`),

  joinSession: (id: string) =>
    api.post<ApiResponse<{ session: LiveSession; participant: LiveSessionParticipant }>>(
      `/live-sessions/${id}/join`
    ),

  leaveSession: (id: string) =>
    api.post<ApiResponse<{ message: string }>>(`/live-sessions/${id}/leave`),

  endSession: (id: string) =>
    api.post<ApiResponse<{ session: LiveSession }>>(`/live-sessions/${id}/end`),

  getParticipants: (id: string) =>
    api.get<ApiResponse<{ participants: LiveSessionParticipant[] }>>(`/live-sessions/${id}/participants`),

  getPolls: (id: string, params?: { active?: boolean }) =>
    api.get<ApiResponse<{ polls: LiveSessionPoll[] }>>(`/live-sessions/${id}/polls`, {
      params: params?.active ? { active: 'true' } : undefined,
    }),

  createPoll: (id: string, data: CreatePollPayload) =>
    api.post<ApiResponse<{ poll: LiveSessionPoll }>>(`/live-sessions/${id}/polls`, data),

  votePoll: (pollId: string, data: VotePollPayload) =>
    api.post<ApiResponse<{ poll: LiveSessionPoll }>>(`/live-sessions/polls/${pollId}/vote`, data),

  getQuestions: (id: string, params?: { status?: string; answered?: boolean }) =>
    api.get<ApiResponse<{ questions: LiveSessionQuestion[] }>>(`/live-sessions/${id}/questions`, {
      params: {
        status: params?.status,
        answered:
          typeof params?.answered === 'boolean' ? (params.answered ? 'true' : 'false') : undefined,
      },
    }),

  askQuestion: (id: string, data: AskQuestionPayload) =>
    api.post<ApiResponse<{ question: LiveSessionQuestion }>>(`/live-sessions/${id}/questions`, data),

  answerQuestion: (questionId: string, data: AnswerQuestionPayload) =>
    api.post<ApiResponse<{ question: LiveSessionQuestion }>>(
      `/live-sessions/questions/${questionId}/answer`,
      data
    ),

  upvoteQuestion: (questionId: string) =>
    api.post<ApiResponse<{ question: LiveSessionQuestion }>>(
      `/live-sessions/questions/${questionId}/upvote`
    ),

  getRecording: (id: string) =>
    api.get<ApiResponse<{ recording: LiveSessionRecording }>>(`/live-sessions/${id}/recording`),

  saveRecording: (id: string, data: { recordingUrl: string; thumbnailUrl?: string; duration: number }) =>
    api.post<ApiResponse<{ recording: LiveSessionRecording }>>(`/live-sessions/${id}/recording`, data),
};


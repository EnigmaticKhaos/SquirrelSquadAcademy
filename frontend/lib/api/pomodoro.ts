import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

export interface PomodoroSession {
  _id: string;
  user: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  sessionType: 'work' | 'short_break' | 'long_break';
  currentPomodoro: number;
  startTime: string;
  endTime?: string;
  duration: number;
  isCompleted: boolean;
  isPaused: boolean;
  pausedAt?: string;
  totalPausedTime: number;
  course?: string;
  lesson?: string;
  activityType?: string;
  completedPomodoros: number;
  totalWorkTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroStatistics {
  totalSessions: number;
  totalPomodoros: number;
  totalWorkTime: number; // in seconds
  averageSessionDuration: number; // in seconds
  longestSession: number; // in seconds
  currentStreak: number;
  bestStreak: number;
  weeklyStats: {
    date: string;
    pomodoros: number;
    workTime: number;
  }[];
}

export const pomodoroApi = {
  // Get active Pomodoro session
  getActiveSession: () => api.get<ApiResponse<{ session: PomodoroSession | null }>>('/study-tools/pomodoro/active'),

  // Start Pomodoro session
  startSession: (data: {
    workDuration?: number;
    shortBreakDuration?: number;
    longBreakDuration?: number;
    longBreakInterval?: number;
    courseId?: string;
    lessonId?: string;
    activityType?: string;
  }) => api.post<ApiResponse<{ session: PomodoroSession }>>('/study-tools/pomodoro/start', data),

  // Pause Pomodoro session
  pauseSession: (sessionId: string) =>
    api.post<ApiResponse<{ session: PomodoroSession }>>(`/study-tools/pomodoro/${sessionId}/pause`),

  // Resume Pomodoro session
  resumeSession: (sessionId: string) =>
    api.post<ApiResponse<{ session: PomodoroSession }>>(`/study-tools/pomodoro/${sessionId}/resume`),

  // Complete Pomodoro session (work/break)
  completeSession: (sessionId: string) =>
    api.post<ApiResponse<{ session: PomodoroSession }>>(`/study-tools/pomodoro/${sessionId}/complete`),

  // End Pomodoro session completely
  endSession: (sessionId: string) =>
    api.post<ApiResponse<{ session: PomodoroSession }>>(`/study-tools/pomodoro/${sessionId}/end`),

  // Get Pomodoro session history
  getHistory: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return api.get<ApiResponse<{ sessions: PomodoroSession[]; total: number }>>(
      `/study-tools/pomodoro/history?${queryParams.toString()}`
    );
  },

  // Get Pomodoro statistics
  getStatistics: () => api.get<ApiResponse<PomodoroStatistics>>('/study-tools/pomodoro/statistics'),
};


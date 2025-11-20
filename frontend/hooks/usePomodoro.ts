import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pomodoroApi, type PomodoroSession, type PomodoroStatistics } from '@/lib/api/pomodoro';

export const useActivePomodoro = () => {
  return useQuery({
    queryKey: ['pomodoro', 'active'],
    queryFn: async () => {
      const response = await pomodoroApi.getActiveSession();
      const apiResponse = response.data;
      return (apiResponse.data as any)?.session || (apiResponse as any)?.session || null;
    },
    refetchInterval: 1000, // Refetch every second to update timer
  });
};

export const usePomodoroHistory = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['pomodoro', 'history', params],
    queryFn: async () => {
      const response = await pomodoroApi.getHistory(params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return (apiResponse.data as any).sessions || [];
      }
      return (apiResponse as any).sessions || [];
    },
  });
};

export const usePomodoroStatistics = () => {
  return useQuery({
    queryKey: ['pomodoro', 'statistics'],
    queryFn: async (): Promise<PomodoroStatistics | null> => {
      const response = await pomodoroApi.getStatistics();
      const apiResponse = response.data;
      return apiResponse.data || (apiResponse as any).statistics || null;
    },
  });
};

export const useStartPomodoro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      workDuration?: number;
      shortBreakDuration?: number;
      longBreakDuration?: number;
      longBreakInterval?: number;
      courseId?: string;
      lessonId?: string;
      activityType?: string;
    }) => pomodoroApi.startSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'statistics'] });
    },
  });
};

export const usePausePomodoro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => pomodoroApi.pauseSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'active'] });
    },
  });
};

export const useResumePomodoro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => pomodoroApi.resumeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'active'] });
    },
  });
};

export const useCompletePomodoro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => pomodoroApi.completeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'statistics'] });
    },
  });
};

export const useEndPomodoro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => pomodoroApi.endSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro', 'statistics'] });
    },
  });
};


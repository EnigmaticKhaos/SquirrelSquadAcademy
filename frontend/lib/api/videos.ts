import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

export interface VideoProgress {
  _id: string;
  user: string;
  lesson: string;
  currentTime: number;
  duration: number;
  progressPercentage: number;
  completed: boolean;
  playbackSpeed?: number;
  volume?: number;
  muted?: boolean;
  captionsEnabled?: boolean;
  captionsLanguage?: string;
  lastWatchedAt: string;
  completedAt?: string;
  watchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const videosApi = {
  updateProgress: (lessonId: string, data: {
    currentTime: number;
    duration: number;
    playbackSpeed?: number;
    volume?: number;
    muted?: boolean;
    captionsEnabled?: boolean;
    captionsLanguage?: string;
  }) => api.post<ApiResponse<VideoProgress>>(`/videos/${lessonId}/progress`, data),
  
  getProgress: (lessonId: string) => 
    api.get<ApiResponse<VideoProgress | null>>(`/videos/${lessonId}/progress`),
  
  getPlaybackUrl: (lessonId: string, params?: { format?: string; quality?: string; startOffset?: number }) => {
    const queryParams: any = {};
    if (params?.format) queryParams.format = params.format;
    if (params?.quality) queryParams.quality = params.quality;
    if (params?.startOffset) queryParams.startOffset = params.startOffset;
    
    return api.get<ApiResponse<{ playbackUrl: string }>>(`/videos/${lessonId}/playback`, { params: queryParams });
  },
};


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

export interface VideoUploadResponse {
  url: string;
  thumbnail: string;
  duration?: number;
}

export interface YouTubeVideoResponse {
  videoId: string;
  thumbnail: string;
  embedUrl: string;
  url: string;
}

export interface UpdateVideoSettingsData {
  videoTranscript?: string;
  videoCaptions?: string;
  allowDownload?: boolean;
  playbackSpeedOptions?: number[];
  interactiveQuizData?: any[];
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
  
  // Admin endpoints
  uploadVideo: (lessonId: string, file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post<ApiResponse<{ video: VideoUploadResponse; message: string }>>(
      `/videos/${lessonId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
  
  setYouTubeVideo: (lessonId: string, youtubeUrl: string) =>
    api.post<ApiResponse<{ video: YouTubeVideoResponse; message: string }>>(
      `/videos/${lessonId}/youtube`,
      { youtubeUrl }
    ),
  
  updateVideoSettings: (lessonId: string, data: UpdateVideoSettingsData) =>
    api.put<ApiResponse<{ lesson: any; message: string }>>(
      `/videos/${lessonId}/settings`,
      data
    ),
};


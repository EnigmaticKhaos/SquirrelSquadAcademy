import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videosApi, type VideoProgress, type UpdateVideoSettingsData } from '@/lib/api';
import { showToast, getErrorMessage } from '@/lib/toast';

export const useVideoProgress = (lessonId: string) => {
  return useQuery<VideoProgress | null>({
    queryKey: ['video-progress', lessonId],
    queryFn: async (): Promise<VideoProgress | null> => {
      try {
        const response = await videosApi.getProgress(lessonId);
        const apiResponse = response.data;
        if (apiResponse.data) {
          return apiResponse.data;
        }
        return (apiResponse as any).progress || null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!lessonId,
    placeholderData: null,
  });
};

export const useUpdateVideoProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: Parameters<typeof videosApi.updateProgress>[1] }) => 
      videosApi.updateProgress(lessonId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['video-progress', variables.lessonId] });
    },
  });
};

export const useVideoPlaybackUrl = (lessonId: string, params?: { format?: string; quality?: string; startOffset?: number }) => {
  return useQuery({
    queryKey: ['video-playback', lessonId, params],
    queryFn: async () => {
      const response = await videosApi.getPlaybackUrl(lessonId, params);
      const apiResponse = response.data;
      return apiResponse.data?.playbackUrl || (apiResponse as any).playbackUrl;
    },
    enabled: !!lessonId,
  });
};

// Admin hooks
export const useUploadVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ lessonId, file }: { lessonId: string; file: File }) =>
      videosApi.uploadVideo(lessonId, file),
    onSuccess: (data, variables) => {
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      showToast.success('Video uploaded', responseData?.message || 'Video uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
    onError: (error) => {
      showToast.error('Upload failed', getErrorMessage(error));
    },
  });
};

export const useSetYouTubeVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ lessonId, youtubeUrl }: { lessonId: string; youtubeUrl: string }) =>
      videosApi.setYouTubeVideo(lessonId, youtubeUrl),
    onSuccess: (data, variables) => {
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      showToast.success('YouTube video added', responseData?.message || 'YouTube video added successfully');
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
    onError: (error) => {
      showToast.error('Failed to add YouTube video', getErrorMessage(error));
    },
  });
};

export const useUpdateVideoSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: UpdateVideoSettingsData }) =>
      videosApi.updateVideoSettings(lessonId, data),
    onSuccess: (data, variables) => {
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      showToast.success('Settings updated', responseData?.message || 'Video settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.lessonId] });
    },
    onError: (error) => {
      showToast.error('Failed to update settings', getErrorMessage(error));
    },
  });
};


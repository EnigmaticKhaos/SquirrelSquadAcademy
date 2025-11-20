import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videosApi, type VideoProgress } from '@/lib/api';

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


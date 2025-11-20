import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savedContentApi, type SavedContent, type SavedContentType } from '@/lib/api/savedContent';

export const useSavedContent = (params?: {
  contentType?: SavedContentType;
  folder?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['saved-content', params],
    queryFn: async () => {
      const response = await savedContentApi.getSavedContent(params);
      const apiResponse = response.data;
      // Backend returns { success: true, savedContent: [], total, count }
      if (apiResponse.data) {
        return {
          data: apiResponse.data.data || [],
          pagination: apiResponse.data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }
      return {
        data: (apiResponse as any).savedContent || [],
        pagination: {
          page: 1,
          limit: 10,
          total: (apiResponse as any).total || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    },
    placeholderData: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
  });
};

export const useSaveContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof savedContentApi.saveContent>[0]) => savedContentApi.saveContent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-content'] });
      queryClient.invalidateQueries({ queryKey: ['saved-content-stats'] });
    },
  });
};

export const useUnsaveContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ contentType, contentId }: { contentType: SavedContentType; contentId: string }) =>
      savedContentApi.unsaveContent(contentType, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-content'] });
      queryClient.invalidateQueries({ queryKey: ['saved-content-stats'] });
      queryClient.invalidateQueries({ queryKey: ['saved-content-check'] });
    },
  });
};

export const useIsContentSaved = (contentType: SavedContentType, contentId: string) => {
  return useQuery({
    queryKey: ['saved-content-check', contentType, contentId],
    queryFn: async () => {
      const response = await savedContentApi.isContentSaved(contentType, contentId);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data.isSaved;
      }
      return (apiResponse as any).isSaved || false;
    },
    enabled: !!contentType && !!contentId,
    placeholderData: false,
  });
};

export const useSavedContentFolders = () => {
  return useQuery({
    queryKey: ['saved-content-folders'],
    queryFn: async () => {
      const response = await savedContentApi.getFolders();
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return (apiResponse as any).folders || [];
    },
    placeholderData: [],
  });
};

export const useSavedContentTags = () => {
  return useQuery({
    queryKey: ['saved-content-tags'],
    queryFn: async () => {
      const response = await savedContentApi.getTags();
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return (apiResponse as any).tags || [];
    },
    placeholderData: [],
  });
};

export const useSavedContentStats = () => {
  return useQuery({
    queryKey: ['saved-content-stats'],
    queryFn: async () => {
      const response = await savedContentApi.getStats();
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return {
        total: 0,
        byType: {} as Record<SavedContentType, number>,
      };
    },
    placeholderData: { total: 0, byType: {} as Record<SavedContentType, number> },
  });
};


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  announcementsApi,
  type Announcement,
  type AnnouncementsResponse,
  type CreateAnnouncementData,
  type UpdateAnnouncementData,
  type GetAnnouncementsParams,
  type AnnouncementStatus,
} from '@/lib/api/announcements';
import { showToast, getErrorMessage } from '@/lib/toast';

export const useAnnouncements = (params?: GetAnnouncementsParams) => {
  return useQuery<AnnouncementsResponse>({
    queryKey: ['announcements', params],
    queryFn: async (): Promise<AnnouncementsResponse> => {
      const response = await announcementsApi.getAnnouncements(params);
      const data = response.data.data || response.data;
      return (data as AnnouncementsResponse) || { count: 0, total: 0, unreadCount: 0, announcements: [] };
    },
    placeholderData: { count: 0, total: 0, unreadCount: 0, announcements: [] },
  });
};

export const useAnnouncement = (id: string, enabled = true) => {
  return useQuery<Announcement>({
    queryKey: ['announcement', id],
    queryFn: async (): Promise<Announcement> => {
      const response = await announcementsApi.getAnnouncement(id);
      const data = response.data.data || response.data;
      return (data as any)?.announcement || data;
    },
    enabled: enabled && !!id,
  });
};

export const useMarkAnnouncementAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => announcementsApi.markAsRead(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'Announcement marked as read';
      showToast.success('Marked as read', message);
    },
    onError: (error) => {
      showToast.error('Failed to mark as read', getErrorMessage(error));
    },
  });
};

// Admin hooks
export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAnnouncementData) => announcementsApi.createAnnouncement(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'Announcement created successfully';
      showToast.success('Announcement created', message);
    },
    onError: (error) => {
      showToast.error('Failed to create announcement', getErrorMessage(error));
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementData }) =>
      announcementsApi.updateAnnouncement(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'Announcement updated successfully';
      showToast.success('Announcement updated', message);
    },
    onError: (error) => {
      showToast.error('Failed to update announcement', getErrorMessage(error));
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => announcementsApi.deleteAnnouncement(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'Announcement deleted successfully';
      showToast.success('Announcement deleted', message);
    },
    onError: (error) => {
      showToast.error('Failed to delete announcement', getErrorMessage(error));
    },
  });
};

export const usePublishAnnouncement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => announcementsApi.publishAnnouncement(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'Announcement published successfully';
      showToast.success('Announcement published', message);
    },
    onError: (error) => {
      showToast.error('Failed to publish announcement', getErrorMessage(error));
    },
  });
};

export const useAllAnnouncements = (params?: { status?: AnnouncementStatus; limit?: number; offset?: number }) => {
  return useQuery<{ announcements: Announcement[]; total: number }>({
    queryKey: ['announcements-admin', params],
    queryFn: async (): Promise<{ announcements: Announcement[]; total: number }> => {
      const response = await announcementsApi.getAllAnnouncements(params);
      const data = response.data.data || response.data;
      return (data as { announcements: Announcement[]; total: number }) || { announcements: [], total: 0 };
    },
    placeholderData: { announcements: [], total: 0 },
  });
};

export const useProcessScheduledAnnouncements = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => announcementsApi.processScheduled(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const processed = responseData?.processed || 0;
      const message = responseData?.message || `Processed ${processed} scheduled announcements`;
      showToast.success('Scheduled announcements processed', message);
    },
    onError: (error) => {
      showToast.error('Failed to process scheduled announcements', getErrorMessage(error));
    },
  });
};


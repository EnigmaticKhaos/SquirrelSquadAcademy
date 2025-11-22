import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  moderationApi,
  type ContentReport,
  type UserWarning,
  type ModerationStats,
  type CreateReportData,
  type ReviewReportData,
  type IssueWarningData,
  type SuspendUserData,
  type BanUserData,
  type GetReportsParams,
} from '@/lib/api/moderation';
import { showToast, getErrorMessage } from '@/lib/toast';

// Reports
export const useModerationReports = (params?: GetReportsParams) => {
  return useQuery<{ reports: ContentReport[]; total: number; count: number }>({
    queryKey: ['moderation-reports', params],
    queryFn: async () => {
      const response = await moderationApi.getReports(params);
      const data = response.data.data || response.data;
      return (data as { reports: ContentReport[]; total: number; count: number }) || { reports: [], total: 0, count: 0 };
    },
    placeholderData: { reports: [], total: 0, count: 0 },
  });
};

export const useModerationReport = (id: string, enabled = true) => {
  return useQuery<ContentReport>({
    queryKey: ['moderation-report', id],
    queryFn: async (): Promise<ContentReport> => {
      const response = await moderationApi.getReport(id);
      const data = response.data.data || response.data;
      return (data as any)?.report || data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateReportData) => moderationApi.createReport(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'Report submitted successfully';
      showToast.success('Report submitted', message);
    },
    onError: (error) => {
      showToast.error('Failed to submit report', getErrorMessage(error));
    },
  });
};

export const useReviewReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewReportData }) =>
      moderationApi.reviewReport(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-report', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'Report reviewed successfully';
      showToast.success('Report reviewed', message);
    },
    onError: (error) => {
      showToast.error('Failed to review report', getErrorMessage(error));
    },
  });
};

// Warnings
export const useUserWarnings = (userId: string, includeExpired = false, enabled = true) => {
  return useQuery<{ warnings: UserWarning[]; count: number }>({
    queryKey: ['user-warnings', userId, includeExpired],
    queryFn: async () => {
      const response = await moderationApi.getUserWarnings(userId, includeExpired);
      const data = response.data.data || response.data;
      return (data as { warnings: UserWarning[]; count: number }) || { warnings: [], count: 0 };
    },
    enabled: enabled && !!userId,
    placeholderData: { warnings: [], count: 0 },
  });
};

export const useIssueWarning = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: IssueWarningData) => moderationApi.issueWarning(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-warnings', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'Warning issued successfully';
      showToast.success('Warning issued', message);
    },
    onError: (error) => {
      showToast.error('Failed to issue warning', getErrorMessage(error));
    },
  });
};

// User Actions
export const useSuspendUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: SuspendUserData }) =>
      moderationApi.suspendUser(userId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'User suspended successfully';
      showToast.success('User suspended', message);
    },
    onError: (error) => {
      showToast.error('Failed to suspend user', getErrorMessage(error));
    },
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: BanUserData }) =>
      moderationApi.banUser(userId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'User banned successfully';
      showToast.success('User banned', message);
    },
    onError: (error) => {
      showToast.error('Failed to ban user', getErrorMessage(error));
    },
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => moderationApi.unbanUser(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'User unbanned successfully';
      showToast.success('User unbanned', message);
    },
    onError: (error) => {
      showToast.error('Failed to unban user', getErrorMessage(error));
    },
  });
};

// Stats
export const useModerationStats = () => {
  return useQuery<ModerationStats>({
    queryKey: ['moderation-stats'],
    queryFn: async () => {
      const response = await moderationApi.getStats();
      const data = response.data.data || response.data;
      return data as ModerationStats;
    },
  });
};


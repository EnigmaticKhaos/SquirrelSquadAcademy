import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waitlistApi, type WaitlistEntry, type WaitlistStatus } from '@/lib/api/waitlist';
import { showToast, getErrorMessage } from '@/lib/toast';

export const useWaitlistStatus = (courseId: string, enabled = true) => {
  return useQuery<WaitlistStatus>({
    queryKey: ['waitlist-status', courseId],
    queryFn: async () => {
      const response = await waitlistApi.getWaitlistStatus(courseId);
      // Backend returns status fields at top level, not in data
      const status = (response.data.data || response.data) as WaitlistStatus;
      const finalStatus = {
        isFull: status?.isFull || false,
        hasWaitlist: status?.hasWaitlist || false,
        maxEnrollments: status?.maxEnrollments,
        currentEnrollments: status?.currentEnrollments || 0,
        userPosition: status?.userPosition ?? null,
      };
      return {
        ...finalStatus,
        isOnWaitlist: finalStatus.userPosition !== null && finalStatus.userPosition > 0,
      };
    },
    enabled: enabled && !!courseId,
  });
};

export const useUserWaitlist = (params?: { status?: string; page?: number; limit?: number }) => {
  return useQuery<{ waitlist: WaitlistEntry[]; total: number }>({
    queryKey: ['user-waitlist', params],
    queryFn: async () => {
      const response = await waitlistApi.getUserWaitlist(params);
      // Backend returns waitlist and total at top level
      const data = response.data.data || response.data;
      return {
        waitlist: data?.waitlist || [],
        total: data?.total || 0,
      };
    },
    placeholderData: { waitlist: [], total: 0 },
  });
};

export const useJoinWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, expiresInDays }: { courseId: string; expiresInDays?: number }) =>
      waitlistApi.joinWaitlist(courseId, expiresInDays),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-status', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      showToast.success('Successfully joined waitlist!', 'You will be notified when a spot becomes available.');
    },
    onError: (error) => {
      showToast.error('Failed to join waitlist', getErrorMessage(error));
    },
  });
};

export const useLeaveWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => waitlistApi.leaveWaitlist(courseId),
    onSuccess: (data, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-status', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      showToast.success('Left waitlist successfully');
    },
    onError: (error) => {
      showToast.error('Failed to leave waitlist', getErrorMessage(error));
    },
  });
};


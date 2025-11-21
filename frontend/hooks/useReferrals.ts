import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  referralsApi,
  type Referral,
  type ReferralStats,
  type ReferralStatus,
  type CreateCustomReferralData,
  type UseReferralData,
} from '@/lib/api/referrals';
import { showToast, getErrorMessage } from '@/lib/toast';

export const useReferralCode = () => {
  return useQuery<{ code: string; status: ReferralStatus; expiresAt?: string; referrerReward?: any; referredReward?: any }>({
    queryKey: ['referral-code'],
    queryFn: async () => {
      const response = await referralsApi.getReferralCode();
      const data = response.data.data || response.data;
      return data?.referral || { code: '', status: 'pending' as ReferralStatus };
    },
    retry: false,
  });
};

export const useReferralStats = () => {
  return useQuery<ReferralStats>({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const response = await referralsApi.getReferralStats();
      const data = response.data.data || response.data;
      return (data as ReferralStats) || {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalRewardsEarned: 0,
        referralCode: '',
      };
    },
    placeholderData: {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalRewardsEarned: 0,
      referralCode: '',
    },
  });
};

export const useReferrals = (params?: { status?: ReferralStatus; limit?: number; offset?: number }) => {
  return useQuery<Referral[]>({
    queryKey: ['referrals', params],
    queryFn: async () => {
      const response = await referralsApi.getReferrals(params);
      const data = response.data.data || response.data;
      return data?.referrals || [];
    },
    placeholderData: [],
  });
};

export const useUseReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UseReferralData) => referralsApi.useReferral(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'Referral code applied successfully';
      showToast.success('Referral code applied', message);
    },
    onError: (error) => {
      showToast.error('Failed to apply referral code', getErrorMessage(error));
    },
  });
};

export const useCreateCustomReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomReferralData) => referralsApi.createCustomReferral(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-code'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      showToast.success('Custom referral code created', 'Your custom referral code has been created successfully.');
    },
    onError: (error) => {
      showToast.error('Failed to create referral code', getErrorMessage(error));
    },
  });
};


import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

// Types
export type ReferralStatus = 'pending' | 'completed' | 'expired';

export type RewardType = 'xp' | 'subscription_days' | 'badge' | 'achievement';

export interface ReferralReward {
  type: RewardType;
  amount?: number;
  itemId?: string;
  granted: boolean;
  grantedAt?: string;
}

export interface Referral {
  _id: string;
  referrer: string | {
    _id: string;
    username: string;
    email: string;
  };
  code: string;
  referredUser?: string | {
    _id: string;
    username: string;
    email: string;
  };
  status: ReferralStatus;
  referrerReward?: ReferralReward;
  referredReward?: ReferralReward;
  requiresPurchase?: boolean;
  requiresSubscription?: boolean;
  expiresAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  referralCode: string;
}

export interface ReferralCode {
  code: string;
  status: ReferralStatus;
  expiresAt?: string;
  referrerReward?: ReferralReward;
  referredReward?: ReferralReward;
}

export interface CreateCustomReferralData {
  referrerReward?: {
    type: RewardType;
    amount?: number;
    itemId?: string;
  };
  referredReward?: {
    type: RewardType;
    amount?: number;
    itemId?: string;
  };
  requiresPurchase?: boolean;
  requiresSubscription?: boolean;
  expiresInDays?: number;
}

export interface UseReferralData {
  code: string;
}

// API Client
export const referralsApi = {
  // Get user's referral code
  getReferralCode: () =>
    api.get<ApiResponse<{ referral: ReferralCode }>>('/referrals/code'),
  
  // Use a referral code
  useReferral: (data: UseReferralData) =>
    api.post<ApiResponse<{ referral: Referral; message: string }>>('/referrals/use', data),
  
  // Get referral statistics
  getReferralStats: () =>
    api.get<ApiResponse<ReferralStats>>('/referrals/stats'),
  
  // Get user's referrals
  getReferrals: (params?: {
    status?: ReferralStatus;
    limit?: number;
    offset?: number;
  }) => api.get<ApiResponse<{ count: number; total: number; referrals: Referral[] }>>('/referrals', { params }),
  
  // Create custom referral code
  createCustomReferral: (data: CreateCustomReferralData) =>
    api.post<ApiResponse<{ referral: Referral; message: string }>>('/referrals/create', data),
};


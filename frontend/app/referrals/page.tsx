'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/layout';
import {
  useReferralCode,
  useReferralStats,
  useReferrals,
  useUseReferral,
  useCreateCustomReferral,
} from '@/hooks/useReferrals';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  Badge,
  LoadingSpinner,
  EmptyState,
  Button,
  Modal,
  Input,
} from '@/components/ui';
import { showToast } from '@/lib/toast';
import type { ReferralStatus, RewardType } from '@/lib/api/referrals';
import { Copy, Share2, Gift, Users, CheckCircle, Clock, XCircle, Plus, ExternalLink } from 'lucide-react';

const STATUS_OPTIONS: { value: ReferralStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'expired', label: 'Expired' },
];

const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  xp: 'XP',
  subscription_days: 'Subscription Days',
  badge: 'Badge',
  achievement: 'Achievement',
};

export default function ReferralsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | ''>('');
  const [showUseCodeModal, setShowUseCodeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  
  const [customReferralData, setCustomReferralData] = useState({
    referrerRewardType: 'xp' as RewardType,
    referrerRewardAmount: '',
    referredRewardType: 'xp' as RewardType,
    referredRewardAmount: '',
    requiresPurchase: false,
    requiresSubscription: false,
    expiresInDays: '',
  });

  const { data: referralCode, isLoading: codeLoading } = useReferralCode();
  const { data: stats, isLoading: statsLoading } = useReferralStats();
  const { data: referrals, isLoading: referralsLoading } = useReferrals({
    status: statusFilter || undefined,
    limit: 50,
  });

  const useReferral = useUseReferral();
  const createCustomReferral = useCreateCustomReferral();

  const [referralLink, setReferralLink] = useState('');
  
  // Set referral link on client side only
  useEffect(() => {
    if (typeof window !== 'undefined' && referralCode?.code) {
      setReferralLink(`${window.location.origin}/register?ref=${referralCode.code}`);
    }
  }, [referralCode?.code]);

  const handleCopyLink = async () => {
    if (!referralLink) {
      showToast.error('No referral link available');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(referralLink);
      showToast.success('Referral link copied', 'Share this link with your friends!');
    } catch (error) {
      showToast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (!referralLink) {
      showToast.error('No referral link available');
      return;
    }

    if (typeof navigator !== 'undefined' && 'share' in navigator && navigator.share) {
      try {
        await navigator.share({
          title: 'Join SquirrelSquad Academy',
          text: 'Check out SquirrelSquad Academy - an amazing learning platform!',
          url: referralLink,
        });
        showToast.success('Shared successfully');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          showToast.error('Failed to share');
        }
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const handleUseReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!referralCodeInput.trim()) {
      showToast.error('Please enter a referral code');
      return;
    }

    try {
      await useReferral.mutateAsync({ code: referralCodeInput.trim() });
      setShowUseCodeModal(false);
      setReferralCodeInput('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCreateCustomReferral = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: any = {};

    if (customReferralData.referrerRewardAmount) {
      data.referrerReward = {
        type: customReferralData.referrerRewardType,
        amount: Number(customReferralData.referrerRewardAmount),
      };
    }

    if (customReferralData.referredRewardAmount) {
      data.referredReward = {
        type: customReferralData.referredRewardType,
        amount: Number(customReferralData.referredRewardAmount),
      };
    }

    if (customReferralData.requiresPurchase) {
      data.requiresPurchase = true;
    }

    if (customReferralData.requiresSubscription) {
      data.requiresSubscription = true;
    }

    if (customReferralData.expiresInDays) {
      data.expiresInDays = Number(customReferralData.expiresInDays);
    }

    try {
      await createCustomReferral.mutateAsync(data);
      setShowCreateModal(false);
      setCustomReferralData({
        referrerRewardType: 'xp',
        referrerRewardAmount: '',
        referredRewardType: 'xp',
        referredRewardAmount: '',
        requiresPurchase: false,
        requiresSubscription: false,
        expiresInDays: '',
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusColor = (status: ReferralStatus) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-400',
      completed: 'bg-green-500/10 text-green-400',
      expired: 'bg-red-500/10 text-red-400',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: ReferralStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <EmptyState
            title="Login Required"
            description="Please log in to view your referrals."
            action={{
              label: 'Go to Login',
              onClick: () => router.push('/login'),
            }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Referrals"
          description="Invite friends and earn rewards! Share your referral link and get rewarded when they join."
        />

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : stats ? (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Referrals</p>
                    <p className="text-2xl font-bold text-gray-100">{stats?.totalReferrals || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-green-400">{stats?.completedReferrals || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats?.pendingReferrals || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Rewards Earned</p>
                    <p className="text-2xl font-bold text-purple-400">{stats?.totalRewardsEarned || 0}</p>
                  </div>
                  <Gift className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Referral Code Section */}
        {codeLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : referralCode?.code ? (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Your Referral Code</h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={referralCode.code}
                    readOnly
                    className="font-mono text-lg"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Your Referral Link</h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      size="sm"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {referralCode.expiresAt && (
                <p className="text-sm text-gray-400">
                  Expires: {new Date(referralCode.expiresAt).toLocaleDateString()}
                </p>
              )}

              <div className="mt-4 flex gap-3">
                <Button
                  onClick={() => setShowUseCodeModal(true)}
                  variant="outline"
                >
                  Use Referral Code
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Custom Code
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Referrals List */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">Your Referrals</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReferralStatus | '')}
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {referralsLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : referrals && referrals.length > 0 ? (
          <div className="space-y-4">
            {referrals.map((referral) => (
              <Card key={referral._id} hover>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(referral.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(referral.status)}
                            {referral.status}
                          </span>
                        </Badge>
                        <span className="text-sm font-mono text-gray-400">{referral.code}</span>
                      </div>

                      {referral.referredUser && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-400">Referred User:</p>
                          <p className="text-gray-100">
                            {typeof referral.referredUser === 'object'
                              ? referral.referredUser.username
                              : 'Unknown'}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {referral.referrerReward && (
                          <div className="p-2 bg-gray-800/50 rounded text-sm">
                            <p className="text-gray-400">Your Reward:</p>
                            <p className="text-gray-100">
                              {referral.referrerReward.amount} {REWARD_TYPE_LABELS[referral.referrerReward.type]}
                              {referral.referrerReward.granted && (
                                <Badge variant="success" size="sm" className="ml-2">Granted</Badge>
                              )}
                            </p>
                          </div>
                        )}

                        {referral.referredReward && (
                          <div className="p-2 bg-gray-800/50 rounded text-sm">
                            <p className="text-gray-400">Their Reward:</p>
                            <p className="text-gray-100">
                              {referral.referredReward.amount} {REWARD_TYPE_LABELS[referral.referredReward.type]}
                              {referral.referredReward.granted && (
                                <Badge variant="success" size="sm" className="ml-2">Granted</Badge>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {referral.requiresPurchase && (
                          <Badge variant="secondary" size="sm">Requires Purchase</Badge>
                        )}
                        {referral.requiresSubscription && (
                          <Badge variant="secondary" size="sm">Requires Subscription</Badge>
                        )}
                        {referral.expiresAt && (
                          <span>Expires: {new Date(referral.expiresAt).toLocaleDateString()}</span>
                        )}
                        <span>Created: {new Date(referral.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No referrals yet"
            description="Share your referral link to start earning rewards!"
          />
        )}

        {/* Use Referral Code Modal */}
        <Modal
          isOpen={showUseCodeModal}
          onClose={() => {
            setShowUseCodeModal(false);
            setReferralCodeInput('');
          }}
          title="Use Referral Code"
        >
          <form onSubmit={handleUseReferralCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Referral Code
              </label>
              <Input
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUseCodeModal(false);
                  setReferralCodeInput('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={useReferral.isPending || !referralCodeInput.trim()}
                className="flex-1"
              >
                {useReferral.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Applying...
                  </>
                ) : (
                  'Apply Code'
                )}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Create Custom Referral Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Custom Referral Code"
          size="lg"
        >
          <form onSubmit={handleCreateCustomReferral} className="space-y-4">
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
              <p className="text-sm text-gray-300">
                Create a custom referral code with specific rewards and conditions.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Reward Type
                </label>
                <select
                  value={customReferralData.referrerRewardType}
                  onChange={(e) => setCustomReferralData({ ...customReferralData, referrerRewardType: e.target.value as RewardType })}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="xp">XP</option>
                  <option value="subscription_days">Subscription Days</option>
                  <option value="badge">Badge</option>
                  <option value="achievement">Achievement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Reward Amount
                </label>
                <Input
                  type="number"
                  value={customReferralData.referrerRewardAmount}
                  onChange={(e) => setCustomReferralData({ ...customReferralData, referrerRewardAmount: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Their Reward Type
                </label>
                <select
                  value={customReferralData.referredRewardType}
                  onChange={(e) => setCustomReferralData({ ...customReferralData, referredRewardType: e.target.value as RewardType })}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="xp">XP</option>
                  <option value="subscription_days">Subscription Days</option>
                  <option value="badge">Badge</option>
                  <option value="achievement">Achievement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Their Reward Amount
                </label>
                <Input
                  type="number"
                  value={customReferralData.referredRewardAmount}
                  onChange={(e) => setCustomReferralData({ ...customReferralData, referredRewardAmount: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expires In (Days)
              </label>
              <Input
                type="number"
                value={customReferralData.expiresInDays}
                onChange={(e) => setCustomReferralData({ ...customReferralData, expiresInDays: e.target.value })}
                placeholder="Leave empty for no expiration"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customReferralData.requiresPurchase}
                  onChange={(e) => setCustomReferralData({ ...customReferralData, requiresPurchase: e.target.checked })}
                  className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Requires Purchase</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customReferralData.requiresSubscription}
                  onChange={(e) => setCustomReferralData({ ...customReferralData, requiresSubscription: e.target.checked })}
                  className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Requires Subscription</span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCustomReferral.isPending}
                className="flex-1"
              >
                {createCustomReferral.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Code
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}


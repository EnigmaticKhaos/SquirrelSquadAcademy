'use client';

import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, Badge, Button, LoadingSpinner, ErrorMessage, ProgressBar } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import { useChallenge, useJoinChallenge, useLeaveChallenge } from '@/hooks/useChallenges';

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();
  const { data, isLoading, error } = useChallenge(id, user?._id);
  const joinMutation = useJoinChallenge();
  const leaveMutation = useLeaveChallenge();

  const challenge = data?.challenge;
  const participant = data?.participant;
  const eligibility = data?.eligibility;

  const handleJoin = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await joinMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    try {
      await leaveMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to leave challenge:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load challenge. Please try again later." />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const progress = participant ? (participant.currentValue / challenge.targetValue) * 100 : 0;
  const isParticipating = !!participant;
  const canJoin = !isParticipating && (eligibility?.eligible !== false);

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Challenges', href: '/challenges' },
              { label: challenge.title },
            ]}
          />

          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Badge variant={challenge.status === 'active' ? 'success' : challenge.status === 'upcoming' ? 'info' : 'secondary'}>
                  {challenge.status}
                </Badge>
              </div>

              <h1 className="mb-4 text-3xl font-bold text-gray-100">{challenge.title}</h1>
              <p className="mb-6 text-lg text-gray-400">{challenge.description}</p>

              <div className="mb-6 space-y-4">
                {isParticipating && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-300">Your Progress</p>
                    <ProgressBar value={Math.min(progress, 100)} showLabel />
                    <p className="mt-1 text-sm text-gray-400">
                      {participant.currentValue} / {challenge.targetValue}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{challenge.participantCount || 0} participants</span>
                  {challenge.xpReward && (
                    <Badge variant="info">Reward: {challenge.xpReward} XP</Badge>
                  )}
                </div>
                {challenge.startDate && challenge.endDate && (
                  <div className="text-sm text-gray-400">
                    <p>Starts: {new Date(challenge.startDate).toLocaleDateString()}</p>
                    <p>Ends: {new Date(challenge.endDate).toLocaleDateString()}</p>
                  </div>
                )}
                {eligibility && !eligibility.eligible && (
                  <div className="rounded-lg bg-yellow-900/20 p-3 text-sm text-yellow-400">
                    {eligibility.reason || 'You are not eligible for this challenge'}
                  </div>
                )}
              </div>

              {isParticipating ? (
                <Button 
                  onClick={handleLeave} 
                  className="w-full" 
                  size="lg"
                  variant="danger"
                  disabled={leaveMutation.isPending}
                >
                  {leaveMutation.isPending ? 'Leaving...' : 'Leave Challenge'}
                </Button>
              ) : (
                <Button 
                  onClick={handleJoin} 
                  className="w-full" 
                  size="lg"
                  disabled={!canJoin || joinMutation.isPending}
                >
                  {joinMutation.isPending ? 'Joining...' : canJoin ? 'Join Challenge' : 'Not Eligible'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


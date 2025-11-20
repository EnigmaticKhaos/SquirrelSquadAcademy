'use client';

import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, Badge, Button, LoadingSpinner, ErrorMessage, ProgressBar } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();

  // Mock challenge data
  const challenge = {
    _id: id,
    title: 'Complete 5 Courses Challenge',
    description: 'Complete 5 courses this month to earn bonus XP',
    status: 'active',
    participantCount: 150,
    xpReward: 500,
    targetValue: 5,
  };

  const handleJoin = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Join challenge logic
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
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
                <Badge variant={challenge.status === 'active' ? 'success' : 'default'}>
                  {challenge.status}
                </Badge>
              </div>

              <h1 className="mb-4 text-3xl font-bold">{challenge.title}</h1>
              <p className="mb-6 text-lg text-gray-600">{challenge.description}</p>

              <div className="mb-6 space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium">Progress</p>
                  <ProgressBar value={60} showLabel />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{challenge.participantCount} participants</span>
                  {challenge.xpReward && (
                    <Badge variant="info">Reward: {challenge.xpReward} XP</Badge>
                  )}
                </div>
              </div>

              <Button onClick={handleJoin} className="w-full" size="lg">
                Join Challenge
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


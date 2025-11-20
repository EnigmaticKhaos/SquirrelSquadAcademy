'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { achievementsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, ProgressBar } from '@/components/ui';
import { PageHeader, Breadcrumbs } from '@/components/layout';
import type { Achievement } from '@/types';

export default function AchievementDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['achievement', id, user?._id],
    queryFn: async () => {
      const params = user?._id ? { userId: user._id } : undefined;
      const response = await achievementsApi.getAchievement(id, params);
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return (apiResponse as any).achievement || null;
    },
    enabled: !!id,
  });

  const achievement = data as (Achievement & { unlocked?: boolean; progress?: { current: number; target: number; percentage: number } }) | null;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'common': return 'default';
      case 'uncommon': return 'info';
      case 'rare': return 'success';
      case 'epic': return 'warning';
      case 'legendary': return 'danger';
      default: return 'default';
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

  if (error || !achievement) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load achievement. Please try again later." />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Achievements', href: '/achievements' },
              { label: achievement.name },
            ]}
          />

          <Card className="mt-8">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-800 text-6xl">
                    {achievement.icon || '⭐'}
                  </div>
                </div>
                <CardTitle className="mb-4 text-4xl text-gray-100">{achievement.name}</CardTitle>
                <p className="mb-6 text-lg text-gray-400">{achievement.description}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Badge variant={getTierColor(achievement.tier)} className="text-sm px-4 py-2">
                    {achievement.tier}
                  </Badge>
                  <Badge variant="info" className="text-sm px-4 py-2">
                    {achievement.xpReward} XP
                  </Badge>
                  {achievement.category && (
                    <Badge variant="secondary" className="text-sm px-4 py-2">
                      {achievement.category}
                    </Badge>
                  )}
                </div>
              </div>

              {user && (
                <div className="mt-8 pt-8 border-t border-gray-700">
                  {achievement.unlocked ? (
                    <div className="text-center">
                      <Badge variant="success" className="text-lg px-6 py-3 mb-4">
                        ✓ Unlocked
                      </Badge>
                      <p className="text-gray-400">Congratulations! You've unlocked this achievement.</p>
                    </div>
                  ) : achievement.progress ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100 mb-4">Progress</h3>
                      <ProgressBar
                        value={achievement.progress.percentage}
                        label={`${achievement.progress.current} / ${achievement.progress.target}`}
                        className="mb-2"
                      />
                      <p className="text-sm text-gray-400 text-center">
                        {achievement.progress.target - achievement.progress.current} more to unlock
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-400">Start working towards this achievement!</p>
                    </div>
                  )}
                </div>
              )}

              {achievement.unlockCriteria && (
                <div className="mt-8 pt-8 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Unlock Criteria</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(achievement.unlockCriteria, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-gray-700 text-center">
                <Link href="/achievements">
                  <button className="text-blue-400 hover:text-blue-300 transition-colors">
                    ← Back to Achievements
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


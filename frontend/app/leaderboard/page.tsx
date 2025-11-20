'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, Select, LoadingSpinner, ErrorMessage, Badge, Avatar } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { useLeaderboard } from '@/hooks/useLeaderboard';

type LeaderboardType = 'global-xp' | 'global-level' | 'global-achievements' | 'global-badges';

export default function LeaderboardPage() {
  const [category, setCategory] = useState<string>('xp');

  // Map category to leaderboard type
  const leaderboardType = useMemo<LeaderboardType>(() => {
    switch (category) {
      case 'xp':
        return 'global-xp';
      case 'level':
        return 'global-level';
      case 'achievements':
        return 'global-achievements';
      case 'badges':
        return 'global-badges';
      default:
        return 'global-xp';
    }
  }, [category]);

  const { data, isLoading, error } = useLeaderboard({
    type: leaderboardType,
    limit: 100,
    offset: 0,
  });

  const leaderboard = data?.leaderboard ?? [];
  const displayLabel = category === 'xp' ? 'XP' : category === 'level' ? 'Level' : category === 'achievements' ? 'Achievements' : 'Badges';

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Leaderboard"
            description="Top performers on the platform"
          />

          <div className="mb-6 flex gap-4">
            <Select
              options={[
                { value: 'xp', label: 'XP' },
                { value: 'level', label: 'Level' },
                { value: 'achievements', label: 'Achievements' },
                { value: 'badges', label: 'Badges' },
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-48"
            />
          </div>

          {isLoading && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load leaderboard. Please try again later." />
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && (
            <Card>
              <CardContent className="p-6">
                {leaderboard.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    No leaderboard data available yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.rank}
                        className="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800 p-4"
                      >
                        <div className="flex w-12 items-center justify-center">
                          {entry.rank <= 3 ? (
                            <Badge variant={entry.rank === 1 ? 'warning' : 'info'}>
                              #{entry.rank}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">#{entry.rank}</span>
                          )}
                        </div>
                        <Avatar
                          src={entry.user.profilePhoto || undefined}
                          name={entry.user.username}
                          size="md"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-100">{entry.user.username}</p>
                          <p className="text-sm text-gray-400">Level {entry.user.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-100">
                            {entry.value.toLocaleString()} {displayLabel}
                          </p>
                          {category === 'xp' && (
                            <p className="text-sm text-gray-400">{entry.user.xp.toLocaleString()} XP</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}


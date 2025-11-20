'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, Select, LoadingSpinner, ErrorMessage, Badge, Avatar } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('all-time');
  const [category, setCategory] = useState<string>('xp');

  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, user: { username: 'user1', profilePhoto: null }, score: 10000, xp: 10000 },
    { rank: 2, user: { username: 'user2', profilePhoto: null }, score: 9500, xp: 9500 },
    { rank: 3, user: { username: 'user3', profilePhoto: null }, score: 9000, xp: 9000 },
  ];

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
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'all-time', label: 'All Time' },
              ]}
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-48"
            />
            <Select
              options={[
                { value: 'xp', label: 'XP' },
                { value: 'courses', label: 'Courses Completed' },
                { value: 'achievements', label: 'Achievements' },
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-48"
            />
          </div>

          <Card>
            <CardContent className="p-6">
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
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-100">{entry.score.toLocaleString()} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


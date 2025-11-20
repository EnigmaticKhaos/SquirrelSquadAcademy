'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, Button, Select } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { useChallenges } from '@/hooks/useChallenges';

export default function ChallengesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const { data, isLoading, error } = useChallenges({
    status: statusFilter || undefined,
    limit: 20,
    page: 1,
    isPublic: true,
  });

  const challenges = data?.data || [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Challenges"
            description="Participate in challenges to earn rewards and compete with others"
          />

          <div className="mb-6">
            <Select
              options={[
                { value: '', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'ended', label: 'Ended' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            />
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load challenges. Please try again later." />
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && challenges.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-400">No challenges found</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && challenges.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <Link key={challenge._id} href={'/challenges/' + challenge._id}>
                  <Card hover={true} className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-gray-100">{challenge.title}</CardTitle>
                        <Badge variant={challenge.status === 'active' ? 'success' : challenge.status === 'upcoming' ? 'info' : 'secondary'}>
                          {challenge.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm text-gray-400 line-clamp-2">
                        {challenge.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{challenge.participantCount || 0} participants</span>
                        {challenge.xpReward && (
                          <Badge variant="info">{challenge.xpReward} XP</Badge>
                        )}
                      </div>
                      {challenge.endDate && (
                        <p className="mt-2 text-xs text-gray-500">
                          Ends: {new Date(challenge.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
    </AppLayout>
  );
}


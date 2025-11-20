'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Challenges"
            description="Participate in challenges to earn rewards and compete with others"
          />

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isLoading && challenges.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-400">No active challenges at the moment</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && challenges.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <Link key={challenge._id} href={`/challenges/${challenge._id}`}>
                  <Card hover className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-gray-100">{challenge.title}</CardTitle>
                        <Badge variant={challenge.status === 'active' ? 'success' : 'secondary'}>
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
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useQuery } from '@tanstack/react-query';
import { achievementsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, SearchBar, Pagination } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { Achievement, PaginatedResponse } from '@/types';

export default function AchievementsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['achievements', { page, search }],
    queryFn: () => achievementsApi.getAchievements({ page, limit: 24 }).then(res => res.data.data),
  });

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

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Achievements"
            description="Unlock achievements by completing various challenges and milestones"
          />

          <div className="mb-6">
            <SearchBar
              placeholder="Search achievements..."
              value={search}
              onChange={setSearch}
              className="max-w-md"
            />
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <ErrorMessage message="Failed to load achievements" onRetry={() => router.refresh()} />
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {data.data?.map((achievement: Achievement) => (
                  <Link key={achievement._id} href={'/achievements/' + achievement._id}>
                    <Card hover={true} className="text-center h-full">
                      <CardContent className="p-6">
                        <div className="mb-4 flex justify-center">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-800 text-4xl">
                            {achievement.icon || '⭐'}
                          </div>
                        </div>
                        <CardTitle className="mb-2 text-lg text-gray-100">{achievement.name}</CardTitle>
                        <p className="mb-4 text-sm text-gray-400 line-clamp-2">{achievement.description}</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          <Badge variant={getTierColor(achievement.tier)}>{achievement.tier}</Badge>
                          <Badge variant="info">{achievement.xpReward} XP</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {data.pagination && (
                <div className="mt-8">
                  <Pagination
                    currentPage={data.pagination.page}
                    totalPages={data.pagination.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
    </AppLayout>
  );
}


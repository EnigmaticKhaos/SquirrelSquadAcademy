'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useQuery } from '@tanstack/react-query';
import { badgesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, SearchBar, Pagination } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { Badge as BadgeType, PaginatedResponse } from '@/types';

export default function BadgesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['badges', { page, search }],
    queryFn: () => badgesApi.getBadges({ page, limit: 24 }).then(res => res.data.data),
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Badges"
            description="Earn badges by completing achievements and milestones"
          />

          <div className="mb-6">
            <SearchBar
              placeholder="Search badges..."
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
            <ErrorMessage message="Failed to load badges" onRetry={() => window.location.reload()} />
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {data.data?.map((badge: BadgeType) => (
                  <Card key={badge._id} hover className="text-center">
                    <CardContent className="p-6">
                      <div className="mb-4 flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-800 text-4xl">
                          {badge.icon || '🏅'}
                        </div>
                      </div>
                      <CardTitle className="mb-2 text-lg text-gray-100">{badge.name}</CardTitle>
                      <p className="mb-4 text-sm text-gray-400">{badge.description}</p>
                      <Badge variant="secondary">{badge.category}</Badge>
                    </CardContent>
                  </Card>
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
      </main>
    </div>
  );
}


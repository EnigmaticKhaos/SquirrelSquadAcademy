'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useLearningPaths } from '@/hooks/useLearningPaths';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, SearchBar, FilterPanel, Pagination, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { LearningPath } from '@/types';

export default function LearningPathsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ type?: string; difficulty?: string; category?: string }>({});
  
  const { data, isLoading, error } = useLearningPaths({
    page,
    limit: 12,
    ...filters,
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Learning Paths"
            description="Structured learning journeys to master new skills"
            actions={
              <Link href="/learning-paths/generate">
                <Button>Generate AI Path</Button>
              </Link>
            }
          />

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SearchBar
              placeholder="Search learning paths..."
              value={search}
              onChange={setSearch}
              className="max-w-md"
            />
            <FilterPanel
              filters={[
                {
                  key: 'type',
                  label: 'Type',
                  type: 'select',
                  options: [
                    { value: '', label: 'All Types' },
                    { value: 'curated', label: 'Curated' },
                    { value: 'ai-powered', label: 'AI-Powered' },
                  ],
                },
                {
                  key: 'difficulty',
                  label: 'Difficulty',
                  type: 'select',
                  options: [
                    { value: '', label: 'All Levels' },
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                    { value: 'expert', label: 'Expert' },
                  ],
                },
                {
                  key: 'category',
                  label: 'Category',
                  type: 'select',
                  options: [
                    { value: '', label: 'All Categories' },
                    { value: 'programming', label: 'Programming' },
                    { value: 'design', label: 'Design' },
                    { value: 'business', label: 'Business' },
                    { value: 'data-science', label: 'Data Science' },
                  ],
                },
              ]}
              values={filters}
              onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value || undefined }))}
              onReset={() => setFilters({})}
            />
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <ErrorMessage message="Failed to load learning paths" onRetry={() => router.refresh()} />
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.data?.map((path: LearningPath) => (
                  <Link key={path._id} href={`/learning-paths/${path._id}`}>
                    <Card hover className="h-full">
                      {path.thumbnail && (
                        <img
                          src={path.thumbnail}
                          alt={path.name}
                          className="h-48 w-full rounded-t-lg object-cover"
                        />
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-gray-100">{path.name}</CardTitle>
                          <Badge variant={path.type === 'ai-powered' ? 'info' : 'secondary'}>
                            {path.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4 text-sm text-gray-400 line-clamp-2">
                          {path.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{path.difficulty}</Badge>
                          {path.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                          <span>{path.courses?.length || 0} courses</span>
                          <span>{path.enrollmentCount || 0} enrolled</span>
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


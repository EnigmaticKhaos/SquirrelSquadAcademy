'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, SearchBar, Pagination } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { courseBundlesApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { CourseBundle, PaginatedResponse } from '@/types';

export default function BundlesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['bundles', { page, search }],
    queryFn: () => courseBundlesApi.getBundles({ page, limit: 12 }).then(res => res.data.data),
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Course Bundles"
            description="Save money by purchasing multiple courses together"
          />

          <div className="mb-6">
            <SearchBar
              placeholder="Search bundles..."
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
            <ErrorMessage message="Failed to load bundles" onRetry={() => window.location.reload()} />
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.data?.map((bundle: CourseBundle) => (
                  <Link key={bundle._id} href={`/bundles/${bundle._id}`}>
                    <Card hover className="h-full">
                      {bundle.thumbnail && (
                        <img
                          src={bundle.thumbnail}
                          alt={bundle.name}
                          className="h-48 w-full rounded-t-lg object-cover"
                        />
                      )}
                      <CardHeader>
                        <CardTitle className="text-gray-100">{bundle.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4 text-sm text-gray-400 line-clamp-2">
                          {bundle.description}
                        </p>
                        <div className="mb-4 flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-100">
                            ${bundle.price}
                          </span>
                          {bundle.originalPrice && bundle.originalPrice > bundle.price && (
                            <>
                              <span className="text-lg text-gray-500 line-through">
                                ${bundle.originalPrice}
                              </span>
                              {bundle.discountPercentage && (
                                <Badge variant="success">
                                  {bundle.discountPercentage}% OFF
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>{bundle.courses?.length || 0} courses</span>
                          <span>{bundle.enrollmentCount || 0} enrolled</span>
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
      </main>
    </div>
  );
}


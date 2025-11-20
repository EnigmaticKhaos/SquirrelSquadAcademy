'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, SearchBar, Pagination, Avatar, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { Project, PaginatedResponse } from '@/types';

export default function ProjectsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', { page, search }],
    queryFn: () => projectsApi.getProjects({ page, limit: 12 }).then(res => res.data.data),
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Projects"
            description="Browse projects shared by the community"
            actions={
              <Link href="/projects/create">
                <Button>Share Project</Button>
              </Link>
            }
          />

          <div className="mb-6">
            <SearchBar
              placeholder="Search projects..."
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
            <ErrorMessage message="Failed to load projects" onRetry={() => router.refresh()} />
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.data?.map((project: Project) => (
                  <Link key={project._id} href={`/projects/${project._id}`}>
                    <Card hover className="h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-gray-100">{project.title}</CardTitle>
                          <Badge variant="default">{project.type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4 text-sm text-gray-400 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="mb-4 flex flex-wrap gap-2">
                          {project.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={typeof project.user === 'object' ? project.user.profilePhoto : undefined}
                              name={typeof project.user === 'object' ? project.user.username : 'User'}
                              size="sm"
                            />
                            <span className="text-sm text-gray-300">
                              {typeof project.user === 'object' ? project.user.username : 'User'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>❤️ {project.likesCount}</span>
                            <span>💬 {project.commentsCount}</span>
                          </div>
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


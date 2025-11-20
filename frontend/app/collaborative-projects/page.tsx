'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useCollaborativeProjects } from '@/hooks/useCollaborativeProjects';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, EmptyState, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { CollaborativeProject } from '@/types';

export default function CollaborativeProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data, isLoading, error } = useCollaborativeProjects({ status: statusFilter || undefined });

  const projects = data?.data || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'planning':
        return 'secondary';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Collaborative Projects"
            description="Work together with other learners on projects"
            actions={
              <Link href="/collaborative-projects/create">
                <Button>Create Project</Button>
              </Link>
            }
          />

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            <Button
              variant={statusFilter === '' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'planning' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('planning')}
              size="sm"
            >
              Planning
            </Button>
            <Button
              variant={statusFilter === 'in_progress' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('in_progress')}
              size="sm"
            >
              In Progress
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('completed')}
              size="sm"
            >
              Completed
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <ErrorMessage message="Failed to load projects. Please try again." />
          ) : projects.length === 0 ? (
            <EmptyState
              title="No collaborative projects"
              description="Create a new project to start collaborating with others."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: CollaborativeProject) => (
                <Link key={project._id} href={`/collaborative-projects/${project._id}`}>
                  <Card hover className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-gray-100">{project.title}</CardTitle>
                        <Badge variant={getStatusBadgeVariant(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                        {project.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{project.members?.length || 0} members</span>
                        <span>{project.tasks?.length || 0} tasks</span>
                      </div>
                      {project.tags && project.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {project.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
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


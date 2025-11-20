'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { Card, CardContent, Badge, LoadingSpinner, ErrorMessage, Button, Avatar, CodeEditor } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import { CommentSection } from '@/components/comments/CommentSection';
import type { Project, Comment } from '@/types';

export default function ProjectDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getProject(id).then(res => res.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <ErrorMessage message="Project not found" />
        </main>
      </div>
    );
  }

  const user = typeof project.user === 'object' ? project.user : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Projects', href: '/projects' },
              { label: project.title },
            ]}
          />

          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-4 flex items-center gap-3">
                    <Avatar
                      src={user?.profilePhoto}
                      name={user?.username || 'User'}
                      size="md"
                    />
                    <div>
                      <Link href={`/profile/${user?._id || ''}`} className="font-medium hover:text-blue-600">
                        {user?.username || 'User'}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <h1 className="mb-4 text-3xl font-bold">{project.title}</h1>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="default">{project.type}</Badge>
                    {project.tags?.map((tag) => (
                      <Badge key={tag} variant="default">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">❤️ {project.likesCount}</Button>
                  <Button variant="outline">Share</Button>
                </div>
              </div>

              <p className="mb-6 whitespace-pre-wrap text-gray-700">{project.description}</p>

              {project.githubRepoUrl && (
                <div className="mb-6">
                  <a
                    href={project.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View on GitHub →
                  </a>
                </div>
              )}

              {project.deployedUrl && (
                <div className="mb-6">
                  <a
                    href={project.deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Live Demo →
                  </a>
                </div>
              )}

              {project.codeSnippet && (
                <div className="mb-6">
                  <h2 className="mb-2 text-xl font-semibold">Code Snippet</h2>
                  <CodeEditor
                    value={project.codeSnippet}
                    language={project.language || 'javascript'}
                    readOnly
                    onChange={() => {}}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-semibold">Comments</h2>
            <CommentSection
              comments={[]}
              onCreateComment={async () => {}}
            />
          </div>
        </div>
      </main>
    </div>
  );
}


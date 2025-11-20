'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useLearningPath, useStartLearningPath } from '@/hooks/useLearningPaths';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, CardContent, Badge, LoadingSpinner, ErrorMessage, ProgressBar } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function LearningPathDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();
  const { data: path, isLoading, error } = useLearningPath(id);
  const startMutation = useStartLearningPath();

  const handleStart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await startMutation.mutateAsync(id);
      // Navigate to first course or progress page
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start learning path');
    }
  };

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

  if (error || !path) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <ErrorMessage message="Learning path not found" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Learning Paths', href: '/learning-paths' },
              { label: path.name },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                {path.thumbnail && (
                  <img
                    src={path.thumbnail}
                    alt={path.name}
                    className="h-64 w-full rounded-t-lg object-cover"
                  />
                )}
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Badge variant={path.type === 'ai-powered' ? 'info' : 'default'}>
                      {path.type}
                    </Badge>
                    <Badge variant="default">{path.difficulty}</Badge>
                  </div>

                  <h1 className="mb-4 text-3xl font-bold text-gray-900">{path.name}</h1>
                  <p className="mb-6 text-lg text-gray-600">{path.description}</p>

                  <div className="mb-6 space-y-4">
                    <div>
                      <h2 className="mb-4 text-xl font-semibold">Courses in this path</h2>
                      <div className="space-y-2">
                        {path.courses?.map((courseItem, index) => (
                          <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium">Course {index + 1}</p>
                              {courseItem.isRequired && (
                                <Badge variant="warning" size="sm">Required</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6 space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Estimated Duration</p>
                      <p className="text-lg font-semibold">{path.estimatedDuration} hours</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Enrollments</p>
                      <p className="text-lg font-semibold">{path.enrollmentCount}</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleStart}
                    isLoading={startMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    Start Learning Path
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


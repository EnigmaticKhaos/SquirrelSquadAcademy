'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCourse } from '@/hooks/useCourses';
import { Card, CardContent, LoadingSpinner, ErrorMessage, Badge } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const { id, moduleId } = params as { id: string; moduleId: string };
  const { data: course, isLoading, error } = useCourse(id);

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

  if (error || !course) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <ErrorMessage message="Course not found" />
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
              { label: 'Courses', href: '/courses' },
              { label: course.title, href: `/courses/${id}` },
              { label: 'Learn', href: `/courses/${id}/learn` },
              { label: 'Module' },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <h2 className="mb-4 text-lg font-semibold">Lessons</h2>
                  <div className="space-y-2">
                    <Link
                      href={`/courses/${id}/modules/${moduleId}/lessons/lesson1`}
                      className="block rounded-md border p-3 text-sm hover:bg-gray-50"
                    >
                      Lesson 1
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <h1 className="mb-4 text-2xl font-bold">Module Content</h1>
                  <p className="text-gray-600">Select a lesson to begin</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


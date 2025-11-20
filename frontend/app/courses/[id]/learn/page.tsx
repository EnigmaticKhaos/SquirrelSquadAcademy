'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCourse } from '@/hooks/useCourses';
import { Card, CardContent, LoadingSpinner, ErrorMessage, ProgressBar } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
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
              { label: 'Learn' },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Sidebar - Course Modules */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <h2 className="mb-4 text-lg font-semibold">Course Content</h2>
                  <div className="space-y-2">
                    {course.modules?.map((moduleId, index) => (
                      <Link
                        key={moduleId}
                        href={`/courses/${id}/modules/${moduleId}`}
                        className="block rounded-md border p-3 text-sm hover:bg-gray-50"
                      >
                        Module {index + 1}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <h1 className="mb-4 text-2xl font-bold">{course.title}</h1>
                  <p className="mb-6 text-gray-600">{course.description}</p>
                  
                  <div className="mb-6">
                    <p className="mb-2 text-sm font-medium text-gray-700">Course Progress</p>
                    <ProgressBar value={0} showLabel />
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                    <p className="text-gray-600">Select a module from the sidebar to start learning</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


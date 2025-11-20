'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, LoadingSpinner, ErrorMessage, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { useCourses } from '@/hooks/useCourses';

export default function ForumsPage() {
  const { data, isLoading, error } = useCourses({ limit: 50, page: 1 });

  const courses = data?.data || [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Forums"
            description="Join discussions and get help from the community"
          />

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load courses. Please try again later." />
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && courses.length === 0 && (
            <EmptyState
              title="No courses available"
              description="Courses will appear here when they are published"
            />
          )}

          {!isLoading && !error && courses.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link key={course._id} href={'/forums/' + course._id}>
                  <Card hover={true} className="h-full">
                    <CardHeader>
                      <CardTitle className="text-gray-100">{course.title}</CardTitle>
                      {course.description && (
                        <CardDescription className="text-gray-400">
                          {course.description.substring(0, 100)}...
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Course Forum</span>
                        <span>Click to view discussions</span>
                      </div>
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


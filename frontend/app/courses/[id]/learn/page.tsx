'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCourse } from '@/hooks/useCourses';
import { useModules } from '@/hooks/useModules';
import { useLessons } from '@/hooks/useLessons';
import { useCourseEnrollment } from '@/hooks/useCourseCompletion';
import { Card, CardContent, LoadingSpinner, ErrorMessage, ProgressBar, Badge } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(id);
  const { data: modules, isLoading: modulesLoading } = useModules(id);
  const { data: enrollment } = useCourseEnrollment(id);

  const isLoading = courseLoading || modulesLoading;
  const error = courseError;

  const progress = enrollment?.progressPercentage || 0;
  const completedLessons = enrollment?.completedLessons || [];
  const completedModules = enrollment?.completedModules || [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <ErrorMessage message="Course not found" />
        </main>
      </div>
    );
  }

  // Get first lesson to start with
  const getFirstLesson = (moduleId: string) => {
    // This will be handled by the module page, but we can link to the module
    return null;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Courses', href: '/courses' },
              { label: course.title, href: '/courses/' + id },
              { label: 'Learn' },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Sidebar - Course Modules */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <h2 className="mb-4 text-lg font-semibold text-gray-100">Course Content</h2>
                  <div className="space-y-2">
                    {modules && modules.length > 0 ? (
                      modules.map((module) => {
                        const isCompleted = completedModules.includes(module._id);
                        return (
                          <Link
                            key={module._id}
                            href={'/courses/' + id + '/modules/' + module._id}
                            className="block rounded-md border border-gray-700 bg-gray-800 p-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span>{module.title}</span>
                              {isCompleted && <Badge variant="success" size="sm">✓</Badge>}
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-400">No modules available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <h1 className="mb-4 text-2xl font-bold text-gray-100">{course.title}</h1>
                  <p className="mb-6 text-gray-400">{course.description}</p>
                  
                  <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-300">Course Progress</p>
                      <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
                    </div>
                    <ProgressBar value={progress} showLabel />
                  </div>

                  {enrollment && (
                    <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Status</p>
                          <p className="font-medium text-gray-100 capitalize">{enrollment.status.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Time Spent</p>
                          <p className="font-medium text-gray-100">{enrollment.timeSpent} minutes</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Completed Lessons</p>
                          <p className="font-medium text-gray-100">{completedLessons.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Completed Modules</p>
                          <p className="font-medium text-gray-100">{completedModules.length}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center">
                    <p className="text-gray-300 mb-4">Select a module from the sidebar to start learning</p>
                    {modules && modules.length > 0 && (
                      <Link href={'/courses/' + id + '/modules/' + modules[0]._id}>
                        <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                          Start Learning
                        </button>
                      </Link>
                    )}
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


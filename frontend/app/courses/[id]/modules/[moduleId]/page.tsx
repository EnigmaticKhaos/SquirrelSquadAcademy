'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Breadcrumbs } from '@/components/layout';
import { useCourse } from '@/hooks/useCourses';
import { useModule } from '@/hooks/useModules';
import { useLessons } from '@/hooks/useLessons';
import { useCourseEnrollment } from '@/hooks/useCourseCompletion';
import {
  Card,
  CardContent,
  LoadingSpinner,
  ErrorMessage,
  Badge,
  Button,
  ProgressBar,
} from '@/components/ui';

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const { id, moduleId } = params as { id: string; moduleId: string };

  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useCourse(id);
  const {
    data: module,
    isLoading: moduleLoading,
    error: moduleError,
  } = useModule(moduleId);
  const {
    data: lessons = [],
    isLoading: lessonsLoading,
    error: lessonsError,
  } = useLessons(moduleId);
  const { data: enrollment } = useCourseEnrollment(id);

  const sortedLessons = useMemo(() => [...lessons].sort((a, b) => a.order - b.order), [lessons]);
  const lessonIds = useMemo(() => new Set(sortedLessons.map((lesson) => lesson._id)), [sortedLessons]);

  const completedLessons = enrollment?.completedLessons ?? [];
  const completedModules = enrollment?.completedModules ?? [];
  const isModuleCompleted = completedModules.includes(moduleId);
  const completedLessonCount = completedLessons.filter((lessonId) => lessonIds.has(lessonId)).length;
  const moduleProgress = sortedLessons.length
    ? Math.round((completedLessonCount / sortedLessons.length) * 100)
    : 0;

  const nextLesson =
    sortedLessons.find((lesson) => !completedLessons.includes(lesson._id)) ?? sortedLessons[0];

  const isLoading = courseLoading || moduleLoading || lessonsLoading;
  const loadError = courseError || moduleError || lessonsError;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-950">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  if (loadError || !course || !module) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-950">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <ErrorMessage message="Unable to load module details" />
        </main>
      </div>
    );
  }

  const handleContinue = () => {
    if (!nextLesson) return;
    router.push(`/courses/${id}/modules/${moduleId}/lessons/${nextLesson._id}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Courses', href: '/courses' },
              { label: course.title, href: `/courses/${id}` },
              { label: 'Learn', href: `/courses/${id}/learn` },
              { label: module.title },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-4">
              <Card>
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Module</p>
                      <h1 className="text-2xl font-bold text-white">{module.title}</h1>
                    </div>
                    <Badge variant={isModuleCompleted ? 'success' : module.isUnlocked ? 'info' : 'warning'}>
                      {isModuleCompleted ? 'Completed' : module.isUnlocked ? 'In Progress' : 'Locked'}
                    </Badge>
                  </div>

                  {module.description && (
                    <p className="text-sm text-gray-400">{module.description}</p>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
                      <span>Progress</span>
                      <span>{moduleProgress}%</span>
                    </div>
                    <ProgressBar value={moduleProgress} />
                  </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                      <p className="text-gray-400">Lessons</p>
                      <p className="text-lg font-semibold text-white">{sortedLessons.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Completed</p>
                        <p className="text-lg font-semibold text-white">{completedLessonCount}</p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleContinue}
                    disabled={!nextLesson || !module.isUnlocked}
                  >
                    {nextLesson ? (completedLessons.includes(nextLesson._id) ? 'Review Lessons' : 'Continue Learning') : 'No Lessons Available'}
                  </Button>
                </CardContent>
              </Card>

              {module.prerequisites && module.prerequisites.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">Prerequisites</h2>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {module.prerequisites.map((prerequisite) => (
                        <li key={prerequisite} className="rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2">
                          {prerequisite}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-8">
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-6 text-xl font-semibold text-white">Lessons</h2>

                  {sortedLessons.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 p-10 text-center">
                      <h3 className="text-lg font-semibold text-white">No lessons available</h3>
                      <p className="mt-2 text-sm text-gray-400">
                        Lessons for this module have not been published yet. Check back soon.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedLessons.map((lesson, index) => {
                        const isLocked = !lesson.isUnlocked;
                        const isCompleted = completedLessons.includes(lesson._id);
                        const isCurrent = nextLesson?._id === lesson._id;

                        const content = (
                          <div
                            className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                              isLocked
                                ? 'border-gray-800 bg-gray-900/60 text-gray-500'
                                : isCompleted
                                  ? 'border-green-500/40 bg-green-500/5'
                                  : isCurrent
                                    ? 'border-blue-500/40 bg-blue-500/5'
                                    : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500">Lesson {index + 1}</span>
                                <p className={`text-lg font-semibold ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                                  {lesson.title}
                                </p>
                              </div>
                              <p className="mt-1 text-sm text-gray-400 line-clamp-2">
                                {lesson.content ? lesson.content.replace(/[#*_`>-]/g, '').slice(0, 120) || 'Lesson details coming soon.' : 'Lesson details coming soon.'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <Badge
                                variant={
                                  isLocked ? 'warning' : isCompleted ? 'success' : isCurrent ? 'info' : 'default'
                                }
                              >
                                {isLocked ? 'Locked' : isCompleted ? 'Completed' : isCurrent ? 'Up Next' : 'Available'}
                              </Badge>
                              {!isLocked && (
                                <span className="text-xs text-gray-400">
                                  {lesson.hasVideo ? 'Video lesson' : 'Reading lesson'}
                                </span>
                              )}
                            </div>
                          </div>
                        );

                          return isLocked ? (
                            <div key={lesson._id} aria-disabled="true" className="cursor-not-allowed">
                              {content}
                            </div>
                          ) : (
                            <Link key={lesson._id} href={`/courses/${id}/modules/${moduleId}/lessons/${lesson._id}`} className="block">
                              {content}
                            </Link>
                          );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


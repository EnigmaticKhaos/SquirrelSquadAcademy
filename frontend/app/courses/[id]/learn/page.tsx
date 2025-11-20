'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCourse } from '@/hooks/useCourses';
import { useModules } from '@/hooks/useModules';
import { useCourseEnrollment } from '@/hooks/useCourseCompletion';
import { Card, CardContent, LoadingSpinner, ErrorMessage, ProgressBar, Badge, Button } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import { CheckCircle2, Circle, Lock, BookOpen, Clock, Play } from 'lucide-react';
import { useState } from 'react';

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(id);
  const { data: modules, isLoading: modulesLoading } = useModules(id);
  const { data: enrollment } = useCourseEnrollment(id);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const isLoading = courseLoading || modulesLoading;
  const error = courseError;

  const progress = enrollment?.progressPercentage || 0;
  const completedLessons = enrollment?.completedLessons || [];
  const completedModules = enrollment?.completedModules || [];

  // Get next lesson to continue
  const getNextLesson = () => {
    if (!modules || modules.length === 0) return null;
    
    for (const module of modules) {
      const moduleLessons = module.lessons || [];
      for (const lessonId of moduleLessons) {
        if (!completedLessons.includes(lessonId)) {
          return { moduleId: module._id, lessonId };
        }
      }
    }
    return null;
  };

  const nextLesson = getNextLesson();

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
                        const moduleLessons = module.lessons || [];
                        const completedInModule = moduleLessons.filter((lid: string) => completedLessons.includes(lid)).length;
                        const isExpanded = expandedModule === module._id;
                        
                        return (
                          <div key={module._id} className="rounded-md border border-gray-700 bg-gray-800 overflow-hidden">
                            <button
                              onClick={() => setExpandedModule(isExpanded ? null : module._id)}
                              className="w-full p-3 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-500" />
                                  )}
                                  <span className="font-medium">{module.title}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {completedInModule} / {moduleLessons.length} lessons
                                </p>
                              </div>
                            </button>
                            {isExpanded && moduleLessons.length > 0 && (
                              <div className="border-t border-gray-700 bg-gray-800/50">
                                {moduleLessons.map((lessonId: string, idx: number) => {
                                  const isLessonCompleted = completedLessons.includes(lessonId);
                                  return (
                                    <Link
                                      key={lessonId}
                                      href={`/courses/${id}/modules/${module._id}/lessons/${lessonId}`}
                                      className="block px-4 py-2 text-xs text-gray-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                                    >
                                      {isLessonCompleted ? (
                                        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <Circle className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                      )}
                                      <span>Lesson {idx + 1}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
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

                  {nextLesson ? (
                    <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Play className="h-6 w-6 text-blue-400" />
                        <div>
                          <h3 className="font-semibold text-gray-100">Continue Learning</h3>
                          <p className="text-sm text-gray-400">Pick up where you left off</p>
                        </div>
                      </div>
                      <Link href={`/courses/${id}/modules/${nextLesson.moduleId}/lessons/${nextLesson.lessonId}`}>
                        <Button variant="primary" className="w-full">
                          Continue to Next Lesson
                        </Button>
                      </Link>
                    </div>
                  ) : progress === 100 ? (
                    <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-6 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-100 mb-2">Course Completed!</h3>
                      <p className="text-sm text-gray-400 mb-4">Congratulations on completing this course</p>
                      <Link href={`/courses/${id}`}>
                        <Button variant="primary">View Certificate</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center">
                      <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-300 mb-4">Select a module from the sidebar to start learning</p>
                      {modules && modules.length > 0 && (
                        <Link href={`/courses/${id}/modules/${modules[0]._id}`}>
                          <Button variant="primary">Start Learning</Button>
                        </Link>
                      )}
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


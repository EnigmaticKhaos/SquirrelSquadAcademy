'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useLearningPath, useStartLearningPath, useLearningPathProgress, useCanStartLearningPath } from '@/hooks/useLearningPaths';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, CardContent, Badge, LoadingSpinner, ErrorMessage, ProgressBar } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import { CheckCircle2, Circle, Lock, BookOpen, Trophy, Clock } from 'lucide-react';
import type { Course } from '@/types';

export default function LearningPathDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();
  const { data: path, isLoading, error } = useLearningPath(id);
  const { data: progress } = useLearningPathProgress(id);
  const { data: canStart } = useCanStartLearningPath(id);
  const startMutation = useStartLearningPath();

  const handleStart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await startMutation.mutateAsync(id);
      router.refresh();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start learning path');
    }
  };

  const getCourseStatus = (courseId: string, index: number) => {
    if (!progress) return 'locked';
    if (progress.completedCourses?.includes(courseId)) return 'completed';
    if (index === progress.currentCourseIndex) return 'current';
    if (index < progress.currentCourseIndex) return 'unlocked';
    return 'locked';
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
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Learning Paths', href: '/learning-paths' },
              { label: path.name },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
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
                    <Badge variant={path.type === 'ai-powered' ? 'info' : 'secondary'}>
                      {path.type}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">{path.difficulty}</Badge>
                  </div>

                  <h1 className="mb-4 text-3xl font-bold text-gray-100">{path.name}</h1>
                  <p className="mb-6 text-lg text-gray-400">{path.description}</p>

                  {/* Progress Bar */}
                  {progress && (
                    <div className="mb-6">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">Progress</span>
                        <span className="text-sm text-gray-400">{progress.progressPercentage || 0}%</span>
                      </div>
                      <ProgressBar value={progress.progressPercentage || 0} />
                    </div>
                  )}

                  {/* Courses */}
                  <div className="mb-6 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-100">Courses in this path</h2>
                    <div className="space-y-3">
                      {path.courses?.map((courseItem, index) => {
                        const courseId = typeof courseItem.course === 'string' ? courseItem.course : (courseItem.course as any)?._id;
                        const course = typeof courseItem.course === 'object' && courseItem.course !== null ? courseItem.course as Course : null;
                        const status = getCourseStatus(courseId || '', index);
                        const isCompleted = status === 'completed';
                        const isCurrent = status === 'current';
                        const isLocked = status === 'locked';

                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-4 rounded-lg border p-4 ${
                              isCurrent
                                ? 'border-blue-500 bg-blue-500/10'
                                : isCompleted
                                ? 'border-green-500/50 bg-green-500/5'
                                : isLocked
                                ? 'border-gray-700 bg-gray-800/50 opacity-60'
                                : 'border-gray-700 bg-gray-800'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                              ) : isCurrent ? (
                                <Circle className="h-6 w-6 text-blue-500 fill-blue-500" />
                              ) : isLocked ? (
                                <Lock className="h-6 w-6 text-gray-500" />
                              ) : (
                                <Circle className="h-6 w-6 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              {course ? (
                                <Link
                                  href={`/courses/${courseId}`}
                                  className={`block ${isLocked ? 'cursor-not-allowed' : 'hover:text-blue-400'}`}
                                  onClick={(e) => {
                                    if (isLocked) e.preventDefault();
                                  }}
                                >
                                  <h3 className="font-semibold text-gray-100">{course.title || `Course ${index + 1}`}</h3>
                                  {course.description && (
                                    <p className="mt-1 text-sm text-gray-400 line-clamp-1">{course.description}</p>
                                  )}
                                </Link>
                              ) : (
                                <div>
                                  <h3 className="font-semibold text-gray-100">Course {index + 1}</h3>
                                </div>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                {courseItem.isRequired && (
                                  <Badge variant="warning" size="sm">Required</Badge>
                                )}
                                {isCurrent && <Badge variant="info" size="sm">Current</Badge>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Milestones */}
                  {path.milestones && path.milestones.length > 0 && (
                    <div>
                      <h2 className="mb-4 text-xl font-semibold text-gray-100 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Milestones
                      </h2>
                      <div className="space-y-3">
                        {path.milestones.map((milestone, index) => {
                          const isCompleted = progress?.completedMilestones?.some(
                            (m: any) => m.milestoneIndex === milestone.courseIndex
                          );
                          return (
                            <div
                              key={index}
                              className={`flex items-center gap-3 rounded-lg border p-3 ${
                                isCompleted
                                  ? 'border-green-500/50 bg-green-500/5'
                                  : 'border-gray-700 bg-gray-800'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Trophy className="h-5 w-5 text-gray-500" />
                              )}
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-100">{milestone.name}</h3>
                                {milestone.description && (
                                  <p className="text-sm text-gray-400">{milestone.description}</p>
                                )}
                                {milestone.xpReward && (
                                  <p className="mt-1 text-xs text-gray-500">+{milestone.xpReward} XP</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Estimated Duration</p>
                        <p className="text-lg font-semibold text-gray-100">{path.estimatedDuration} hours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Courses</p>
                        <p className="text-lg font-semibold text-gray-100">{path.courses?.length || 0}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Enrollments</p>
                      <p className="text-lg font-semibold text-gray-100">{path.enrollmentCount || 0}</p>
                    </div>
                    {progress && (
                      <div>
                        <p className="text-sm text-gray-400">Status</p>
                        <Badge
                          variant={
                            progress.status === 'completed'
                              ? 'success'
                              : progress.status === 'in_progress'
                              ? 'info'
                              : 'secondary'
                          }
                          className="mt-1"
                        >
                          {progress.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {progress ? (
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          const nextCourse = path.courses?.[progress.currentCourseIndex || 0];
                          if (nextCourse) {
                            const courseId = typeof nextCourse.course === 'string' 
                              ? nextCourse.course 
                              : nextCourse.course?._id;
                            if (courseId) {
                              router.push(`/courses/${courseId}`);
                            }
                          }
                        }}
                        className="w-full"
                        size="lg"
                      >
                        Continue Learning
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleStart}
                      isLoading={startMutation.isPending}
                      disabled={!canStart?.canStart}
                      className="w-full"
                      size="lg"
                    >
                      {!canStart?.canStart && canStart?.reason
                        ? canStart.reason
                        : 'Start Learning Path'}
                    </Button>
                  )}
                  {!canStart?.canStart && canStart?.reason && (
                    <p className="mt-2 text-xs text-gray-400">{canStart.reason}</p>
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


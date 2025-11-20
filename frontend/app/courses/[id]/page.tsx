'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useCourse, useEnrollCourse } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { useWaitlistStatus, useJoinWaitlist, useLeaveWaitlist } from '@/hooks/useWaitlist';
import { Button, Card, CardContent, Rating, Badge, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { showToast, getErrorMessage } from '@/lib/toast';
import { PageHeader, Breadcrumbs } from '@/components/layout';
import { ReviewSection } from '@/components/courses/ReviewSection';
import { Clock, Users, BookOpen } from 'lucide-react';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();
  const { data: course, isLoading, error } = useCourse(id);
  const enrollMutation = useEnrollCourse();
  const { data: waitlistStatus, isLoading: isLoadingWaitlist } = useWaitlistStatus(id, !!id);
  const joinWaitlistMutation = useJoinWaitlist();
  const leaveWaitlistMutation = useLeaveWaitlist();

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await enrollMutation.mutateAsync(id);
      showToast.success('Successfully enrolled in course!');
      router.push(`/courses/${id}/learn`);
    } catch (error: any) {
      showToast.error('Failed to enroll in course', getErrorMessage(error));
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await joinWaitlistMutation.mutateAsync({ courseId: id });
    } catch (error: any) {
      // Error is handled by the hook
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!user) return;

    try {
      await leaveWaitlistMutation.mutateAsync(id);
    } catch (error: any) {
      // Error is handled by the hook
    }
  };

  const isCourseFull = waitlistStatus?.isFull || false;
  const hasWaitlist = waitlistStatus?.hasWaitlist || course?.hasWaitlist || false;
  const userPosition = waitlistStatus?.userPosition ?? null;
  const isOnWaitlist = waitlistStatus?.isOnWaitlist || (userPosition !== null && userPosition > 0);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !course) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorMessage
            message={error ? 'Failed to load course' : 'Course not found'}
            onRetry={() => router.refresh()}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Courses', href: '/courses' },
              { label: course.title },
            ]}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <CardContent className="p-0">
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="mb-6 h-64 w-full rounded-lg object-cover"
                  />
                )}

                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <Badge variant="info">{course.courseType}</Badge>
                  <Badge variant="default">{course.difficulty}</Badge>
                  {course.isFree && <Badge variant="success">Free</Badge>}
                  {course.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="default">{tag}</Badge>
                  ))}
                </div>

                <h1 className="mb-4 text-3xl font-bold text-gray-100">
                  {course.title}
                </h1>

                <p className="mb-6 text-lg text-gray-300">
                  {course.description}
                </p>

                {/* Course Details */}
                <div className="mb-6 space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Category:</span>
                    <span className="text-sm text-gray-300">{course.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Enrollments:</span>
                    <span className="text-sm text-gray-300">{course.enrollmentCount} students</span>
                  </div>
                  {course.averageRating && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-400">Rating:</span>
                      <div className="flex items-center gap-2">
                        <Rating value={course.averageRating} readonly showValue />
                        <span className="text-sm text-gray-300">({course.reviewCount} reviews)</span>
                      </div>
                    </div>
                  )}
                  {!course.isFree && course.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-400">Price:</span>
                      <span className="text-lg font-bold text-gray-100">${course.price}</span>
                    </div>
                  )}
                </div>
                </CardContent>
              </Card>

              {/* Reviews Section */}
              <ReviewSection courseId={id} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8 p-6">
                <CardContent className="p-0">
                {course.isFree ? (
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-green-400">Free</span>
                  </div>
                ) : (
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-gray-100">
                      ${course.price}
                    </span>
                  </div>
                )}

                {isCourseFull && hasWaitlist ? (
                  <div className="space-y-3">
                    {isOnWaitlist ? (
                      <>
                        <div className="rounded-lg border border-blue-500 bg-blue-50 p-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                            <Clock className="h-5 w-5" />
                            <span className="font-semibold">You're on the waitlist</span>
                          </div>
                          {userPosition && (
                            <p className="text-sm text-blue-600">
                              Your position: <span className="font-bold">#{userPosition}</span>
                            </p>
                          )}
                          <p className="text-xs text-blue-600 mt-2">
                            You'll be notified when a spot becomes available
                          </p>
                        </div>
                        <Button
                          onClick={handleLeaveWaitlist}
                          isLoading={leaveWaitlistMutation.isPending}
                          className="w-full"
                          size="lg"
                          variant="outline"
                        >
                          Leave Waitlist
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleJoinWaitlist}
                        isLoading={joinWaitlistMutation.isPending}
                        className="w-full"
                        size="lg"
                        variant="primary"
                      >
                        Join Waitlist
                      </Button>
                    )}
                    <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-3 text-center">
                      <p className="text-sm text-yellow-800">
                        <Users className="h-4 w-4 inline mr-1" />
                        Course is full ({waitlistStatus?.currentEnrollments || course.enrollmentCount}
                        {waitlistStatus?.maxEnrollments && ` / ${waitlistStatus.maxEnrollments}`} enrolled)
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleEnroll}
                    isLoading={enrollMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {course.isFree ? 'Enroll for Free' : 'Enroll Now'}
                  </Button>
                )}

                <div className="mt-6 space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Community support</span>
                  </div>
                </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </AppLayout>
  );
}


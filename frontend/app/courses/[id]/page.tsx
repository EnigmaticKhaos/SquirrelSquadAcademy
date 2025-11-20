'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCourse, useEnrollCourse } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, CardContent, Rating, Badge, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { PageHeader, Breadcrumbs } from '@/components/layout';
import { ReviewSection } from '@/components/courses/ReviewSection';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();
  const { data: course, isLoading, error } = useCourse(id);
  const enrollMutation = useEnrollCourse();

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await enrollMutation.mutateAsync(id);
      router.push(`/courses/${id}/learn`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to enroll in course');
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

  if (error || !course) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <ErrorMessage
            message={error ? 'Failed to load course' : 'Course not found'}
            onRetry={() => router.refresh()}
          />
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

                <h1 className="mb-4 text-3xl font-bold text-gray-900">
                  {course.title}
                </h1>

                <p className="mb-6 text-lg text-gray-600">
                  {course.description}
                </p>

                {/* Course Details */}
                <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Category:</span>
                    <span className="text-sm text-gray-600">{course.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Enrollments:</span>
                    <span className="text-sm text-gray-600">{course.enrollmentCount} students</span>
                  </div>
                  {course.averageRating && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Rating:</span>
                      <div className="flex items-center gap-2">
                        <Rating value={course.averageRating} readonly showValue />
                        <span className="text-sm text-gray-600">({course.reviewCount} reviews)</span>
                      </div>
                    </div>
                  )}
                  {!course.isFree && course.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Price:</span>
                      <span className="text-lg font-bold text-gray-900">${course.price}</span>
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
                    <span className="text-2xl font-bold text-green-600">Free</span>
                  </div>
                ) : (
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      ${course.price}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleEnroll}
                  isLoading={enrollMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {course.isFree ? 'Enroll for Free' : 'Enroll Now'}
                </Button>

                <div className="mt-6 space-y-2 text-sm text-gray-600">
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
      </main>
    </div>
  );
}


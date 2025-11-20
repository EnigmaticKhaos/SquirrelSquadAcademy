'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCourse } from '@/hooks/useCourses';
import { Card, CardContent, Button, VideoPlayer, LoadingSpinner, ErrorMessage, MarkdownRenderer } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { id, moduleId, lessonId } = params as { id: string; moduleId: string; lessonId: string };
  const { data: course, isLoading, error } = useCourse(id);

  // Mock lesson data - in real app, fetch from API
  const lesson = {
    title: 'Introduction to the Course',
    content: '# Welcome to the Lesson\n\nThis is the lesson content.',
    hasVideo: true,
    videoUrl: 'https://example.com/video.mp4',
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
              { label: 'Module', href: `/courses/${id}/modules/${moduleId}` },
              { label: lesson.title },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Lessons</h2>
                  </div>
                  <div className="space-y-2">
                    <Link
                      href={`/courses/${id}/modules/${moduleId}/lessons/${lessonId}`}
                      className="block rounded-md border border-blue-500 bg-blue-50 p-3 text-sm font-medium text-blue-700"
                    >
                      {lesson.title}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <h1 className="mb-6 text-3xl font-bold">{lesson.title}</h1>
                  
                  {lesson.hasVideo && lesson.videoUrl && (
                    <div className="mb-6">
                      <VideoPlayer src={lesson.videoUrl} controls />
                    </div>
                  )}

                  <div className="mb-6">
                    <MarkdownRenderer content={lesson.content} />
                  </div>

                  <div className="flex items-center justify-between border-t pt-6">
                    <Button variant="outline" onClick={() => router.back()}>
                      Previous
                    </Button>
                    <Button variant="primary">
                      Mark as Complete
                    </Button>
                    <Button variant="outline">
                      Next Lesson
                    </Button>
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


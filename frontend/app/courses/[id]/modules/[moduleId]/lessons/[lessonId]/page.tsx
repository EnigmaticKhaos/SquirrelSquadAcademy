'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { useCourse } from '@/hooks/useCourses';
import { useLesson } from '@/hooks/useLessons';
import { useLessons } from '@/hooks/useLessons';
import { useModule } from '@/hooks/useModules';
import { useVideoProgress, useUpdateVideoProgress } from '@/hooks/useVideos';
import { useUpdateCourseProgress } from '@/hooks/useCourseCompletion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, Button, VideoPlayer, LoadingSpinner, ErrorMessage, MarkdownRenderer, Badge, VideoUploadModal } from '@/components/ui';
import { Upload } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { id, moduleId, lessonId } = params as { id: string; moduleId: string; lessonId: string };
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(id);
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useLesson(lessonId);
  const { data: module } = useModule(moduleId);
  const { data: lessons } = useLessons(moduleId);
  const { data: videoProgress } = useVideoProgress(lessonId);
  const updateVideoProgress = useUpdateVideoProgress();
  const updateCourseProgress = useUpdateCourseProgress();
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  const isLoading = courseLoading || lessonLoading;
  const error = courseError || lessonError;

  // Find current lesson index
  const currentIndex = lessons?.findIndex((l) => l._id === lessonId) ?? -1;
  const previousLesson = currentIndex > 0 ? lessons?.[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && lessons && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const handleMarkComplete = async () => {
    if (!lesson) return;
    try {
      await updateCourseProgress.mutateAsync({
        courseId: id,
        data: { lessonId: lesson._id, completed: true },
      });
    } catch (error) {
      console.error('Failed to mark lesson as complete:', error);
    }
  };

  const handleVideoTimeUpdate = (currentTime: number, duration: number, settings?: {
    playbackSpeed?: number;
    volume?: number;
    muted?: boolean;
    captionsEnabled?: boolean;
    captionsLanguage?: string;
  }) => {
    if (!lesson || !lesson.hasVideo) return;
    updateVideoProgress.mutate({
      lessonId: lesson._id,
      data: { 
        currentTime, 
        duration,
        ...(settings && {
          playbackSpeed: settings.playbackSpeed,
          volume: settings.volume,
          muted: settings.muted,
          captionsEnabled: settings.captionsEnabled,
          captionsLanguage: settings.captionsLanguage,
        }),
      },
    });
  };

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

  if (error || !course || !lesson) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <ErrorMessage message={error ? "Failed to load lesson" : "Lesson not found"} />
        </main>
      </div>
    );
  }

  const isCompleted = videoProgress?.completed || false;

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Courses', href: '/courses' },
              { label: course.title, href: '/courses/' + id },
              { label: 'Learn', href: '/courses/' + id + '/learn' },
              { label: module?.title || 'Module', href: '/courses/' + id + '/modules/' + moduleId },
              { label: lesson.title },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-100">Lessons</h2>
                  </div>
                  <div className="space-y-2">
                    {lessons?.map((l) => {
                      const isActive = l._id === lessonId;
                      return (
                        <Link
                          key={l._id}
                          href={'/courses/' + id + '/modules/' + moduleId + '/lessons/' + l._id}
                          className={`block rounded-md border p-3 text-sm transition-colors ${
                            isActive
                              ? 'border-blue-500 bg-blue-900/20 text-blue-300 font-medium'
                              : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {l.title}
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-bold text-gray-100">{lesson.title}</h1>
                      {isCompleted && <Badge variant="success">Completed</Badge>}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUploadModal(true)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {lesson.hasVideo ? 'Change Video' : 'Add Video'}
                      </Button>
                    )}
                  </div>
                  
                  {lesson.hasVideo && lesson.videoUrl ? (
                    <div className="mb-6">
                      <VideoPlayer
                        src={lesson.videoUrl}
                        poster={lesson.videoThumbnail}
                        controls
                        lessonId={lesson._id}
                        videoProgress={videoProgress || undefined}
                        onTimeUpdate={handleVideoTimeUpdate}
                        startTime={videoProgress?.currentTime}
                        videoSource={lesson.videoSource as 'upload' | 'youtube'}
                        videoId={lesson.videoId}
                      />
                    </div>
                  ) : isAdmin ? (
                    <div className="mb-6 border-2 border-dashed border-gray-700 rounded-lg p-12 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-400 mb-2">No video uploaded for this lesson</p>
                      <Button
                        variant="outline"
                        onClick={() => setShowUploadModal(true)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Video
                      </Button>
                    </div>
                  ) : null}

                  <div className="mb-6">
                    <MarkdownRenderer content={lesson.content} />
                  </div>

                  {lesson.resources && lesson.resources.length > 0 && (
                    <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
                      <h3 className="mb-2 text-lg font-semibold text-gray-100">Resources</h3>
                      <ul className="space-y-2">
                        {lesson.resources.map((resource, index) => (
                          <li key={index}>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              {resource.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-700 pt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (previousLesson) {
                          router.push('/courses/' + id + '/modules/' + moduleId + '/lessons/' + previousLesson._id);
                        } else {
                          router.back();
                        }
                      }}
                      disabled={!previousLesson}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleMarkComplete}
                      disabled={isCompleted || updateCourseProgress.isPending}
                    >
                      {isCompleted ? 'Completed' : 'Mark as Complete'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (nextLesson) {
                          router.push('/courses/' + id + '/modules/' + moduleId + '/lessons/' + nextLesson._id);
                        }
                      }}
                      disabled={!nextLesson}
                    >
                      Next Lesson
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {isAdmin && lesson && (
        <VideoUploadModal
          lessonId={lesson._id}
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            // Refetch lesson data
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}


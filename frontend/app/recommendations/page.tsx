'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useCourseRecommendations, useLearningPathRecommendations } from '@/hooks/useRecommendations';
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner, ErrorMessage, EmptyState, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, ProgressBar } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { Star, Users, Clock, BookOpen, TrendingUp, Sparkles } from 'lucide-react';
import type { Course, LearningPath } from '@/types';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'paths'>('courses');
  const { data: courseRecommendations, isLoading: coursesLoading } = useCourseRecommendations({ limit: 12 });
  const { data: pathRecommendations, isLoading: pathsLoading } = useLearningPathRecommendations({ limit: 6 });

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-300">Please log in to view personalized recommendations</p>
              <Link href="/login">
                <Button variant="primary" className="w-full">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isLoading = coursesLoading || pathsLoading;
  const hasCourseRecommendations = courseRecommendations && courseRecommendations.length > 0;
  const hasPathRecommendations = pathRecommendations && pathRecommendations.length > 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Recommendations"
            description="Personalized course and learning path recommendations powered by AI"
          />

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isLoading && (
            <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="courses">
                  Courses ({courseRecommendations?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="paths">
                  Learning Paths ({pathRecommendations?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="mt-6">
                {!hasCourseRecommendations ? (
                  <EmptyState
                    title="No course recommendations yet"
                    description="Complete some courses to get personalized recommendations based on your learning journey"
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courseRecommendations.map((rec) => {
                      const course = rec.course as Course;
                      return (
                        <Link key={course._id} href={`/courses/${course._id}`}>
                          <Card hover className="h-full">
                            {course.thumbnail && (
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="h-48 w-full rounded-t-lg object-cover"
                              />
                            )}
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-gray-100 line-clamp-2">{course.title}</CardTitle>
                                <Badge variant="info" className="flex-shrink-0">
                                  {Math.round(rec.matchScore * 100)}% match
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="mb-3 text-sm text-gray-400 line-clamp-2">{course.description}</p>
                              <div className="mb-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-blue-300">{rec.reason}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {course.difficulty && (
                                  <Badge variant="secondary" className="capitalize">
                                    {course.difficulty}
                                  </Badge>
                                )}
                                {course.averageRating && (
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {course.averageRating.toFixed(1)}
                                  </span>
                                )}
                                {course.enrollmentCount !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {course.enrollmentCount}
                                  </span>
                                )}
                                {course.estimatedDuration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {course.estimatedDuration}h
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="paths" className="mt-6">
                {!hasPathRecommendations ? (
                  <EmptyState
                    title="No learning path recommendations yet"
                    description="Complete some courses to get personalized learning path recommendations"
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pathRecommendations.map((rec) => {
                      const path = rec.learningPath as LearningPath;
                      return (
                        <Link key={path._id} href={`/learning-paths/${path._id}`}>
                          <Card hover className="h-full">
                            {path.thumbnail && (
                              <img
                                src={path.thumbnail}
                                alt={path.name}
                                className="h-48 w-full rounded-t-lg object-cover"
                              />
                            )}
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-gray-100">{path.name}</CardTitle>
                                <Badge variant="info" className="flex-shrink-0">
                                  {Math.round(rec.matchScore * 100)}% match
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="mb-3 text-sm text-gray-400 line-clamp-2">{path.description}</p>
                              <div className="mb-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-blue-300">{rec.reason}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {path.difficulty && (
                                  <Badge variant="secondary" className="capitalize">
                                    {path.difficulty}
                                  </Badge>
                                )}
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {path.courses?.length || 0} courses
                                </span>
                                {path.estimatedDuration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {path.estimatedDuration}h
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
    </AppLayout>
  );
}


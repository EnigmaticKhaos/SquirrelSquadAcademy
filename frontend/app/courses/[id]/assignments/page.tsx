'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCourse } from '@/hooks/useCourses';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { api } from '@/lib/apiClient';
import { useState, useEffect } from 'react';
import type { Assignment } from '@/types';

export default function CourseAssignmentsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchAssignments();
    }
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/courses/${courseId}/assignments`);
      if (response.data.success) {
        setAssignments(response.data.assignments || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  if (courseLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ErrorMessage message={error} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title={'Assignments - ' + (course?.title || 'Course')}
            description="Complete assignments to test your knowledge and earn XP"
            breadcrumbs={[
              { label: 'Courses', href: '/courses' },
              { label: course?.title || 'Course', href: '/courses/' + courseId },
              { label: 'Assignments', href: '/courses/' + courseId + '/assignments' },
            ]}
          />

          {assignments.length === 0 ? (
            <EmptyState
              title="No assignments"
              description="There are no assignments for this course yet."
            />
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const assignmentUrl = '/courses/' + courseId + '/assignments/' + assignment._id;
                return (
                  <Link key={assignment._id} href={assignmentUrl}>
                    <Card hover={true}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-gray-100">{assignment.title}</CardTitle>
                            <p className="mt-2 text-sm text-gray-400">{assignment.description}</p>
                          </div>
                          <div className="ml-4 flex flex-col items-end gap-2">
                            <Badge variant={assignment.isRequired ? 'danger' : 'secondary'}>
                              {assignment.isRequired ? 'Required' : 'Optional'}
                            </Badge>
                            {assignment.deadline && (
                              <span className="text-xs text-gray-400">
                                Due: {new Date(assignment.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>Points: {assignment.totalPoints || 0}</span>
                            <span>Type: {assignment.assignmentType}</span>
                            {assignment.maxRetries !== undefined && (
                              <span>Max Retries: {assignment.maxRetries}</span>
                            )}
                          </div>
                          <Badge variant="info">View Assignment →</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useCourse } from '@/hooks/useCourses';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { api } from '@/lib/apiClient';
import type { Assignment, Submission } from '@/types';
import { Textarea } from '@/components/ui';

export default function AssignmentDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;
  const { data: course } = useCourse(courseId);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
      fetchSubmission();
    }
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      const response = await api.get(`/courses/${courseId}/assignments/${assignmentId}`);
      if (response.data.success) {
        setAssignment(response.data.assignment);
        if (response.data.assignment.starterCode) {
          setSubmissionContent(response.data.assignment.starterCode);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmission = async () => {
    try {
      const response = await api.get(`/courses/${courseId}/assignments/${assignmentId}/submission`);
      if (response.data.success && response.data.submission) {
        setSubmission(response.data.submission);
        setSubmissionContent(response.data.submission.content || '');
      }
    } catch (err: any) {
      // Submission might not exist yet, which is fine
      console.log('No submission found');
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const response = await api.post(`/courses/${courseId}/assignments/${assignmentId}/submit`, {
        content: submissionContent,
      });
      if (response.data.success) {
        setSubmission(response.data.submission);
        alert('Assignment submitted successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error && !assignment) {
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

  if (!assignment) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title={assignment.title}
            description={assignment.description}
            breadcrumbs={[
              { label: 'Courses', href: '/courses' },
              { label: course?.title || 'Course', href: `/courses/${courseId}` },
              { label: 'Assignments', href: `/courses/${courseId}/assignments` },
              { label: assignment.title, href: `/courses/${courseId}/assignments/${assignmentId}` },
            ]}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-100">Assignment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Description</h3>
                    <p className="text-gray-400 whitespace-pre-wrap">{assignment.description}</p>
                  </div>

                  {assignment.rubric && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-2">Rubric</h3>
                      <p className="text-gray-400 whitespace-pre-wrap">{assignment.rubric}</p>
                    </div>
                  )}

                  {assignment.starterCode && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-2">Starter Code</h3>
                      <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-300">
                        <code>{assignment.starterCode}</code>
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-100">Your Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submission && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Status:</span>
                        <Badge
                          variant={
                            submission.status === 'graded'
                              ? 'success'
                              : submission.status === 'failed'
                              ? 'danger'
                              : 'info'
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      {submission.score !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Score:</span>
                          <span className="text-sm font-medium text-gray-100">
                            {submission.score} / {submission.maxScore}
                          </span>
                        </div>
                      )}
                      {submission.feedback && (
                        <div>
                          <span className="text-sm font-medium text-gray-300">Feedback:</span>
                          <p className="mt-1 text-sm text-gray-400">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {assignment.assignmentType === 'coding' ? 'Your Code' : 'Your Answer'}
                    </label>
                    <Textarea
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      rows={15}
                      className="font-mono text-sm"
                      placeholder={
                        assignment.assignmentType === 'coding'
                          ? 'Write your code here...'
                          : 'Write your answer here...'
                      }
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-900/50 border border-red-800 p-4">
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    isLoading={submitting}
                    disabled={!submissionContent.trim() || (submission?.status === 'graded' && !assignment.allowRetries)}
                    className="w-full"
                  >
                    {submission ? 'Resubmit Assignment' : 'Submit Assignment'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-100">Assignment Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-400">Type:</span>
                    <p className="text-sm font-medium text-gray-100 capitalize">
                      {assignment.assignmentType}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Points:</span>
                    <p className="text-sm font-medium text-gray-100">{assignment.totalPoints}</p>
                  </div>
                  {assignment.deadline && (
                    <div>
                      <span className="text-sm text-gray-400">Deadline:</span>
                      <p className="text-sm font-medium text-gray-100">
                        {new Date(assignment.deadline).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-400">Retries:</span>
                    <p className="text-sm font-medium text-gray-100">
                      {assignment.allowRetries
                        ? assignment.maxRetries
                          ? `${assignment.maxRetries} allowed`
                          : 'Unlimited'
                        : 'Not allowed'}
                    </p>
                  </div>
                  {submission && (
                    <div>
                      <span className="text-sm text-gray-400">Attempt:</span>
                      <p className="text-sm font-medium text-gray-100">
                        {submission.attemptNumber}
                        {assignment.maxRetries && ` / ${assignment.maxRetries}`}
                      </p>
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


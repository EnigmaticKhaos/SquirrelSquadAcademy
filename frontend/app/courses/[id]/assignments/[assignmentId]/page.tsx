'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useCourse } from '@/hooks/useCourses';
import { useAssignment } from '@/hooks/useAssignments';
import { useLatestSubmission, useSubmitAssignment } from '@/hooks/useSubmissions';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { Assignment, Submission } from '@/types';
import { Textarea } from '@/components/ui';

export default function AssignmentDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;
  const { data: course } = useCourse(courseId);
  const { data: assignment, isLoading: assignmentLoading, error: assignmentError } = useAssignment(assignmentId);
  const { data: submission, isLoading: submissionLoading } = useLatestSubmission(assignmentId);
  const submitAssignment = useSubmitAssignment();
  const [submissionContent, setSubmissionContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assignment?.starterCode && !submission) {
      setSubmissionContent(assignment.starterCode);
    }
  }, [assignment, submission]);

  useEffect(() => {
    if (submission?.content) {
      setSubmissionContent(submission.content);
    }
  }, [submission]);

  const handleSubmit = async () => {
    if (!submissionContent.trim()) {
      setError('Submission content cannot be empty');
      return;
    }

    try {
      setError(null);
      await submitAssignment.mutateAsync({
        assignmentId,
        data: { content: submissionContent },
      });
      // Success message will be shown via toast or similar
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
    }
  };

  const isLoading = assignmentLoading || submissionLoading;
  const displayError = assignmentError ? (typeof assignmentError === 'string' ? assignmentError : assignmentError.message) : error;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (displayError && !assignment) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ErrorMessage message={displayError || 'Failed to load assignment'} />
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
                    isLoading={submitAssignment.isPending}
                    disabled={
                      !submissionContent.trim() ||
                      (submission?.status === 'graded' && !assignment.allowRetries) ||
                      submitAssignment.isPending
                    }
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


'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { useCourse } from '@/hooks/useCourses';
import { useAssignment } from '@/hooks/useAssignments';
import { useLatestSubmission, useSubmitAssignment } from '@/hooks/useSubmissions';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingSpinner, ErrorMessage, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { Assignment, Submission } from '@/types';
import { Textarea, CodeEditor } from '@/components/ui';
import { uploadApi } from '@/lib/api';
import { Paperclip, X, File, FileText, Code } from 'lucide-react';

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
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (assignment?.starterCode && !submission) {
      setSubmissionContent(assignment.starterCode);
    }
  }, [assignment, submission]);

  useEffect(() => {
    if (submission?.content) {
      setSubmissionContent(submission.content);
    }
    if (submission?.files) {
      setUploadedFiles(submission.files);
    }
  }, [submission]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setFilesToUpload((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFileToUpload = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('text/') || type.includes('code') || type.includes('javascript') || type.includes('python')) {
      return Code;
    }
    if (type.includes('pdf') || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (!submissionContent.trim() && filesToUpload.length === 0 && uploadedFiles.length === 0) {
      setError('Submission content or files are required');
      return;
    }

    try {
      setError(null);
      setUploading(true);

      // Upload new files
      const newFiles: Array<{ name: string; url: string; type: string }> = [...uploadedFiles];
      
      for (const file of filesToUpload) {
        try {
          let uploadResponse;
          if (assignment?.assignmentType === 'coding' || file.type.includes('code') || file.type.includes('javascript') || file.type.includes('python')) {
            uploadResponse = await uploadApi.uploadCode(file, `assignments/${assignmentId}`);
          } else {
            uploadResponse = await uploadApi.uploadDocument(file, `assignments/${assignmentId}`);
          }
          
          if (uploadResponse.data.data) {
            newFiles.push({
              name: file.name,
              url: uploadResponse.data.data.url,
              type: file.type,
            });
          }
        } catch (uploadError: any) {
          console.error('Failed to upload file:', uploadError);
          setError(`Failed to upload ${file.name}: ${uploadError.response?.data?.message || 'Upload failed'}`);
          setUploading(false);
          return;
        }
      }

      // Submit assignment with content and files
      await submitAssignment.mutateAsync({
        assignmentId,
        data: {
          content: submissionContent || '',
          files: newFiles.length > 0 ? newFiles : undefined,
        },
      });

      // Clear files after successful submission
      setFilesToUpload([]);
      setUploadedFiles([]);
      setUploading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
      setUploading(false);
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

                  {/* Display existing submission files */}
                  {submission?.files && submission.files.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-2">Submitted Files</h3>
                      <div className="space-y-2">
                        {submission.files.map((file, idx) => {
                          const FileIcon = getFileIcon(file.type);
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 border border-gray-700"
                            >
                              <FileIcon className="w-4 h-4 text-gray-400" />
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-sm text-blue-400 hover:text-blue-300 truncate"
                              >
                                {file.name}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Files to upload */}
                  {(filesToUpload.length > 0 || uploadedFiles.length > 0) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-2">Files to Submit</h3>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, idx) => {
                          const FileIcon = getFileIcon(file.type);
                          return (
                            <div
                              key={`uploaded-${idx}`}
                              className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 border border-gray-700"
                            >
                              <FileIcon className="w-4 h-4 text-gray-400" />
                              <span className="flex-1 text-sm text-gray-300 truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeUploadedFile(idx)}
                                className="p-1 hover:bg-gray-700 rounded"
                              >
                                <X className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          );
                        })}
                        {filesToUpload.map((file, idx) => {
                          const FileIcon = getFileIcon(file.type);
                          return (
                            <div
                              key={`to-upload-${idx}`}
                              className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 border border-gray-700"
                            >
                              <FileIcon className="w-4 h-4 text-gray-400" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-300 truncate">{file.name}</p>
                                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFileToUpload(idx)}
                                className="p-1 hover:bg-gray-700 rounded"
                              >
                                <X className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        {assignment.assignmentType === 'coding' ? 'Your Code' : 'Your Answer'}
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept={
                          assignment.assignmentType === 'coding'
                            ? '.js,.ts,.py,.java,.cpp,.c,.cs,.html,.css,.json'
                            : '.pdf,.doc,.docx,.txt,.csv'
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        Attach Files
                      </Button>
                    </div>
                    {assignment.assignmentType === 'coding' ? (
                      <CodeEditor
                        value={submissionContent}
                        onChange={(value) => setSubmissionContent(value)}
                        language={assignment.language || 'javascript'}
                        placeholder="Write your code here..."
                        className="bg-gray-800 border-gray-700 text-gray-100"
                      />
                    ) : (
                      <Textarea
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        rows={15}
                        className="font-mono text-sm bg-gray-800 border-gray-700 text-gray-100"
                        placeholder="Write your answer here..."
                      />
                    )}
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-900/50 border border-red-800 p-4">
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    isLoading={submitAssignment.isPending || uploading}
                    disabled={
                      (!submissionContent.trim() && filesToUpload.length === 0 && uploadedFiles.length === 0) ||
                      (submission?.status === 'graded' && !assignment.allowRetries) ||
                      submitAssignment.isPending ||
                      uploading
                    }
                    className="w-full"
                  >
                    {uploading
                      ? 'Uploading files...'
                      : submission
                      ? 'Resubmit Assignment'
                      : 'Submit Assignment'}
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


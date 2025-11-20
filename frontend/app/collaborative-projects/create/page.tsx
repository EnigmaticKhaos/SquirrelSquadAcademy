'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collaborativeProjectsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Button, LoadingSpinner, ErrorMessage, Textarea } from '@/components/ui';
import { PageHeader, Breadcrumbs } from '@/components/layout';

export default function CreateCollaborativeProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    assignmentId: '',
    maxMembers: '10',
    isPublic: false,
    allowMemberInvites: true,
    requireApprovalForJoining: false,
  });
  const [error, setError] = useState<string | null>(null);

  const createProject = useMutation({
    mutationFn: (data: Parameters<typeof collaborativeProjectsApi.createProject>[0]) => 
      collaborativeProjectsApi.createProject(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['collaborative-projects'] });
      if (response.data?.project) {
        router.push('/collaborative-projects/' + response.data.project._id);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    try {
      setError(null);
      await createProject.mutateAsync({
        title: formData.title.trim(),
        description: formData.description.trim(),
        courseId: formData.courseId.trim() || undefined,
        assignmentId: formData.assignmentId.trim() || undefined,
        maxMembers: formData.maxMembers ? parseInt(formData.maxMembers, 10) : undefined,
        settings: {
          isPublic: formData.isPublic,
          allowMemberInvites: formData.allowMemberInvites,
          requireApprovalForJoining: formData.requireApprovalForJoining,
        },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-400">Please log in to create a collaborative project</p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Collaborative Projects', href: '/collaborative-projects' },
              { label: 'Create Project' },
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-gray-100">Create Collaborative Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter project title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    className="w-full"
                    placeholder="Describe your collaborative project..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="courseId" className="block text-sm font-medium text-gray-300 mb-2">
                      Course ID (optional)
                    </label>
                    <input
                      id="courseId"
                      type="text"
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Course ID"
                    />
                  </div>
                  <div>
                    <label htmlFor="assignmentId" className="block text-sm font-medium text-gray-300 mb-2">
                      Assignment ID (optional)
                    </label>
                    <input
                      id="assignmentId"
                      type="text"
                      value={formData.assignmentId}
                      onChange={(e) => setFormData({ ...formData, assignmentId: e.target.value })}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Assignment ID"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum Members
                  </label>
                  <input
                    id="maxMembers"
                    type="number"
                    min="2"
                    max="50"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>

                <div className="space-y-4 border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-100">Project Settings</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="isPublic" className="text-sm font-medium text-gray-300">
                        Public Project
                      </label>
                      <p className="text-xs text-gray-400">Allow others to discover and join this project</p>
                    </div>
                    <input
                      id="isPublic"
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="allowMemberInvites" className="text-sm font-medium text-gray-300">
                        Allow Member Invites
                      </label>
                      <p className="text-xs text-gray-400">Let members invite others to the project</p>
                    </div>
                    <input
                      id="allowMemberInvites"
                      type="checkbox"
                      checked={formData.allowMemberInvites}
                      onChange={(e) => setFormData({ ...formData, allowMemberInvites: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="requireApprovalForJoining" className="text-sm font-medium text-gray-300">
                        Require Approval for Joining
                      </label>
                      <p className="text-xs text-gray-400">Require owner approval before members can join</p>
                    </div>
                    <input
                      id="requireApprovalForJoining"
                      type="checkbox"
                      checked={formData.requireApprovalForJoining}
                      onChange={(e) => setFormData({ ...formData, requireApprovalForJoining: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-900/50 border border-red-800 p-4">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={createProject.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!formData.title.trim() || !formData.description.trim() || createProject.isPending}
                    isLoading={createProject.isPending}
                  >
                    Create Project
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


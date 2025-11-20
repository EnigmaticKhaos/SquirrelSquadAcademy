'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Button, LoadingSpinner, ErrorMessage, Textarea, Select } from '@/components/ui';
import { PageHeader, Breadcrumbs } from '@/components/layout';
import type { ProjectType } from '@/types';

export default function CreateProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'github' as ProjectType,
    githubRepoUrl: '',
    deployedUrl: '',
    codeSnippet: '',
    language: '',
    tags: '',
    category: '',
    course: '',
    assignment: '',
  });
  const [error, setError] = useState<string | null>(null);

  const createProject = useMutation({
    mutationFn: (data: Parameters<typeof projectsApi.createProject>[0]) => projectsApi.createProject(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (response.data?.project) {
        router.push('/projects/' + response.data.project._id);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.type) {
      setError('Title and type are required');
      return;
    }

    try {
      setError(null);
      const tagsArray = formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      await createProject.mutateAsync({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        githubRepoUrl: formData.githubRepoUrl.trim() || undefined,
        deployedUrl: formData.deployedUrl.trim() || undefined,
        codeSnippet: formData.codeSnippet.trim() || undefined,
        language: formData.language.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        category: formData.category.trim() || undefined,
        course: formData.course.trim() || undefined,
        assignment: formData.assignment.trim() || undefined,
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
              <p className="mb-4 text-center text-gray-400">Please log in to create a project</p>
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
              { label: 'Projects', href: '/projects' },
              { label: 'Create Project' },
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-gray-100">Create New Project</CardTitle>
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
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full"
                    placeholder="Describe your project..."
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                    Project Type <span className="text-red-400">*</span>
                  </label>
                  <Select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectType })}
                    className="w-full"
                    options={[
                      { value: 'github', label: 'GitHub Repository' },
                      { value: 'deployed', label: 'Deployed Project' },
                      { value: 'code', label: 'Code Snippet' },
                      { value: 'file', label: 'File Upload' },
                    ]}
                  />
                </div>

                {formData.type === 'github' && (
                  <div>
                    <label htmlFor="githubRepoUrl" className="block text-sm font-medium text-gray-300 mb-2">
                      GitHub Repository URL
                    </label>
                    <input
                      id="githubRepoUrl"
                      type="url"
                      value={formData.githubRepoUrl}
                      onChange={(e) => setFormData({ ...formData, githubRepoUrl: e.target.value })}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                )}

                {formData.type === 'deployed' && (
                  <div>
                    <label htmlFor="deployedUrl" className="block text-sm font-medium text-gray-300 mb-2">
                      Deployed URL
                    </label>
                    <input
                      id="deployedUrl"
                      type="url"
                      value={formData.deployedUrl}
                      onChange={(e) => setFormData({ ...formData, deployedUrl: e.target.value })}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="https://your-project.com"
                    />
                  </div>
                )}

                {formData.type === 'code' && (
                  <>
                    <div>
                      <label htmlFor="codeSnippet" className="block text-sm font-medium text-gray-300 mb-2">
                        Code Snippet
                      </label>
                      <Textarea
                        id="codeSnippet"
                        value={formData.codeSnippet}
                        onChange={(e) => setFormData({ ...formData, codeSnippet: e.target.value })}
                        rows={10}
                        className="w-full font-mono text-sm"
                        placeholder="Paste your code here..."
                      />
                    </div>
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">
                        Programming Language
                      </label>
                      <input
                        id="language"
                        type="text"
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., JavaScript, Python, Java"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    id="tags"
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., react, javascript, web-development"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <input
                    id="category"
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Web Development, Mobile App"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="course" className="block text-sm font-medium text-gray-300 mb-2">
                      Course ID (optional)
                    </label>
                    <input
                      id="course"
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Course ID"
                    />
                  </div>
                  <div>
                    <label htmlFor="assignment" className="block text-sm font-medium text-gray-300 mb-2">
                      Assignment ID (optional)
                    </label>
                    <input
                      id="assignment"
                      type="text"
                      value={formData.assignment}
                      onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Assignment ID"
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
                    disabled={!formData.title.trim() || !formData.type || createProject.isPending}
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


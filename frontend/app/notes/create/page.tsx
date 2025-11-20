'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useCreateNote } from '@/hooks/useNotes';
import { Card, CardContent, CardHeader, CardTitle, Input, Textarea, Button, ErrorMessage } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function CreateNotePage() {
  const router = useRouter();
  const { user } = useAuth();
  const createNote = useCreateNote();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    lessonId: '',
    courseId: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    if (!formData.lessonId || !formData.courseId) {
      setError('Lesson ID and Course ID are required');
      return;
    }

    try {
      setError(null);
      const tagsArray = formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : undefined;
      
      const result = await createNote.mutateAsync({
        lessonId: formData.lessonId,
        courseId: formData.courseId,
        title: formData.title.trim() || undefined,
        content: formData.content.trim(),
        tags: tagsArray,
      });
      
      if (result.data?.note) {
        router.push('/notes/' + result.data.note._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create note');
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Notes', href: '/notes' },
              { label: 'Create Note' },
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-gray-100">Create New Note</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter note title..."
                />

                <Textarea
                  label="Content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={15}
                  placeholder="Write your note here... (Markdown supported)"
                  required
                />

                <Input
                  label="Lesson ID"
                  value={formData.lessonId}
                  onChange={(e) => setFormData({ ...formData, lessonId: e.target.value })}
                  placeholder="Enter lesson ID"
                  required
                />

                <Input
                  label="Course ID"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  placeholder="Enter course ID"
                  required
                />

                <Input
                  label="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., javascript, react, notes"
                />

                {error && (
                  <div className="rounded-md bg-red-900/50 border border-red-800 p-4">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => router.back()}
                    disabled={createNote.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!formData.content.trim() || !formData.lessonId || !formData.courseId || createNote.isPending}
                    isLoading={createNote.isPending}
                  >
                    Save Note
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


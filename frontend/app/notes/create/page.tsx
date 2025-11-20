'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, Input, Textarea, Button } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function CreateNotePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Create note logic
    router.push('/notes');
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Notes', href: '/notes' },
              { label: 'Create Note' },
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Create New Note</CardTitle>
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
                  label="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., javascript, react, notes"
                />

                <div className="flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Note</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


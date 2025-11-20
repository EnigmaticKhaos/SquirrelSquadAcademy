'use client';

import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, LoadingSpinner, ErrorMessage, Button, MarkdownRenderer } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();

  // Mock note data
  const note = {
    _id: id,
    title: 'Sample Note',
    content: '# My Note\n\nThis is the note content.',
    tags: ['javascript', 'react'],
    updatedAt: new Date().toISOString(),
  };

  const isOwner = true; // Check if user owns the note

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Notes', href: '/notes' },
              { label: note.title },
            ]}
          />

          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="mb-4 text-3xl font-bold">{note.title}</h1>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/notes/${id}/edit`)}>
                      Edit
                    </Button>
                    <Button variant="danger">Delete</Button>
                  </div>
                )}
              </div>

              <div className="prose max-w-none">
                <MarkdownRenderer content={note.content} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


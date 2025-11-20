'use client';

import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, LoadingSpinner, ErrorMessage, Button, MarkdownRenderer, Badge } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import { useNote, useDeleteNote } from '@/hooks/useNotes';

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();
  const { data: note, isLoading, error } = useNote(id);
  const deleteMutation = useDeleteNote();

  const isOwner = user && note && (typeof note.user === 'string' ? note.user === user._id : note.user._id === user._id);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      router.push('/notes');
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load note. Please try again later." />
              </CardContent>
            </Card>
          </div>
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
              { label: 'Notes', href: '/notes' },
              { label: note.title || 'Untitled Note' },
            ]}
          />

          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="mb-4 text-3xl font-bold text-gray-100">{note.title || 'Untitled Note'}</h1>
                  {note.tags && note.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-gray-700 px-3 py-1 text-sm text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-400">
                    Last updated: {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/notes/' + id + '/edit')}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="prose prose-invert max-w-none">
                <MarkdownRenderer content={note.content} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


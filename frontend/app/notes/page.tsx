'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner, ErrorMessage, EmptyState, Button, SearchBar, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { useNotes } from '@/hooks/useNotes';

export default function NotesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useNotes({
    search: search || undefined,
    limit: 50,
    offset: 0,
  });

  const notes = data?.notes || [];

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-400">Please log in to view your notes</p>
              <Link href="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="My Notes"
            description="Your personal notes and study materials"
            actions={
              <Link href="/notes/create">
                <Button>Create Note</Button>
              </Link>
            }
          />

          <div className="mb-6">
            <SearchBar
              placeholder="Search notes..."
              onSearch={setSearch}
              className="max-w-md"
            />
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load notes. Please try again later." />
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && notes.length === 0 && (
            <EmptyState
              title="No notes yet"
              description="Create your first note to get started"
              action={{
                label: 'Create Note',
                onClick: () => router.push('/notes/create'),
              }}
            />
          )}

          {!isLoading && !error && notes.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Link key={note._id} href={'/notes/' + note._id}>
                  <Card hover={true} className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg text-gray-100">
                          {note.title || 'Untitled Note'}
                        </CardTitle>
                        {note.isPinned && (
                          <Badge variant="info">Pinned</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm text-gray-400 line-clamp-3">
                        {note.content}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {note.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="rounded-full bg-gray-700 px-2 py-1 text-xs text-gray-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


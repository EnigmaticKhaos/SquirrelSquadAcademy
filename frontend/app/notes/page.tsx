'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner, ErrorMessage, EmptyState, Button, SearchBar } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-600">Please log in to view your notes</p>
              <Link href="/login">
                <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Go to Login
                </button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
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

          {!isLoading && notes.length === 0 && (
            <EmptyState
              title="No notes yet"
              description="Create your first note to get started"
              action={{
                label: 'Create Note',
                onClick: () => window.location.href = '/notes/create',
              }}
            />
          )}

          {!isLoading && notes.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Link key={note._id} href={`/notes/${note._id}`}>
                  <Card hover className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm text-gray-600 line-clamp-3">
                        {note.content}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {note.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 text-xs text-gray-500">
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


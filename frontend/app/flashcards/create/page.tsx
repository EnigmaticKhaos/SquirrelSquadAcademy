'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useCreateDeck } from '@/hooks/useFlashcards';
import { Card, CardContent, CardHeader, CardTitle, Button, LoadingSpinner, ErrorMessage, Textarea } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function CreateFlashcardDeckPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createDeck = useCreateDeck();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setError(null);
      const result = await createDeck.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      if (result.data?.deck) {
        router.push('/flashcards/decks/' + result.data.deck._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create deck');
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-400">Please log in to create a flashcard deck</p>
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
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Create Flashcard Deck"
            description="Create a new deck to organize your flashcards"
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-gray-100">Deck Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter deck title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full"
                    placeholder="Enter deck description (optional)"
                  />
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
                    disabled={createDeck.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!title.trim() || createDeck.isPending}
                    isLoading={createDeck.isPending}
                  >
                    Create Deck
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


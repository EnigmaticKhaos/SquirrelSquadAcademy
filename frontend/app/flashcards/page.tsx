'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner, ErrorMessage, EmptyState, Button, SearchBar } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-600">Please log in to view your flashcard decks</p>
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
            title="Flashcard Decks"
            description="Create and study flashcard decks to reinforce your learning"
            actions={
              <Link href="/flashcards/create">
                <Button>Create Deck</Button>
              </Link>
            }
          />

          <div className="mb-6">
            <SearchBar
              placeholder="Search decks..."
              onSearch={setSearch}
              className="max-w-md"
            />
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isLoading && decks.length === 0 && (
            <EmptyState
              title="No flashcard decks yet"
              description="Create your first deck to start studying"
              action={{
                label: 'Create Deck',
                onClick: () => window.location.href = '/flashcards/create',
              }}
            />
          )}

          {!isLoading && decks.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {decks.map((deck) => (
                <Link key={deck._id} href={`/flashcards/decks/${deck._id}`}>
                  <Card hover className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{deck.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {deck.description && (
                        <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                          {deck.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{deck.cardCount || 0} cards</span>
                        <Button variant="outline" size="sm">
                          Study
                        </Button>
                      </div>
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


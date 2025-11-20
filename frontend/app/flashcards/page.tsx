'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner, ErrorMessage, EmptyState, Button, SearchBar, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { useFlashcardDecks } from '@/hooks/useFlashcards';

export default function FlashcardsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const { data: decks, isLoading, error } = useFlashcardDecks({ archived: false });

  const filteredDecks = decks?.filter(deck => 
    !search || deck.title.toLowerCase().includes(search.toLowerCase()) || 
    deck.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-400">Please log in to view your flashcard decks</p>
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

          {error && (
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load flashcard decks. Please try again later." />
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && filteredDecks.length === 0 && (
            <EmptyState
              title="No flashcard decks yet"
              description="Create your first deck to start studying"
              action={{
                label: 'Create Deck',
                onClick: () => router.push('/flashcards/create'),
              }}
            />
          )}

          {!isLoading && !error && filteredDecks.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDecks.map((deck) => (
                <Link key={deck._id} href={'/flashcards/decks/' + deck._id}>
                  <Card hover={true} className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-100">{deck.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {deck.description && (
                        <p className="mb-4 text-sm text-gray-400 line-clamp-2">
                          {deck.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{deck.totalCards || 0} cards</span>
                        {deck.cardsDue > 0 && (
                          <Badge variant="info">{deck.cardsDue} due</Badge>
                        )}
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


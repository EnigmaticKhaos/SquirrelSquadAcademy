'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useFlashcardDeck, useDeckCards, useCreateFlashcard, useDeleteFlashcard } from '@/hooks/useFlashcards';
import { Card, CardContent, CardHeader, CardTitle, Button, LoadingSpinner, ErrorMessage, Modal, Textarea, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { Flashcard } from '@/types';

export default function FlashcardDeckPage() {
  const params = useParams();
  const router = useRouter();
  const { deckId } = params as { deckId: string };
  const { data: deck, isLoading: deckLoading, error: deckError } = useFlashcardDeck(deckId);
  const { data: cards, isLoading: cardsLoading } = useDeckCards(deckId, { archived: false });
  const createFlashcard = useCreateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      setError('Front and back are required');
      return;
    }

    try {
      setError(null);
      await createFlashcard.mutateAsync({
        deckId,
        data: {
          front: front.trim(),
          back: back.trim(),
          hint: hint.trim() || undefined,
        },
      });
      setFront('');
      setBack('');
      setHint('');
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create flashcard');
    }
  };

  const handleDeleteFlashcard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    try {
      await deleteFlashcard.mutateAsync(cardId);
    } catch (err: any) {
      console.error('Failed to delete flashcard:', err);
    }
  };

  if (deckLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  if (deckError || !deck) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ErrorMessage message="Failed to load flashcard deck" />
          </div>
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
            title={deck.title}
            description={deck.description || 'Manage your flashcards'}
            actions={
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateModal(true)}>Add Card</Button>
                <Link href={'/flashcards/decks/' + deckId + '/study'}>
                  <Button variant="primary">Study</Button>
                </Link>
              </div>
            }
          />

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {cardsLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : cards && cards.length > 0 ? (
                <div className="space-y-4">
                  {cards.map((card: Flashcard) => (
                    <Card key={card._id}>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-400 mb-2">Front</p>
                            <p className="text-gray-100">{card.front}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-400 mb-2">Back</p>
                            <p className="text-gray-100">{card.back}</p>
                          </div>
                        </div>
                        {card.hint && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <p className="text-sm font-medium text-gray-400 mb-1">Hint</p>
                            <p className="text-sm text-gray-300">{card.hint}</p>
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFlashcard(card._id)}
                            disabled={deleteFlashcard.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-400 mb-4">No flashcards yet</p>
                    <Button onClick={() => setShowCreateModal(true)}>Add Your First Card</Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-100">Deck Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Cards</p>
                    <p className="text-lg font-semibold text-gray-100">{deck.totalCards || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Active Cards</p>
                    <p className="text-lg font-semibold text-gray-100">{deck.activeCards || 0}</p>
                  </div>
                  {deck.cardsDue > 0 && (
                    <div>
                      <p className="text-sm text-gray-400">Cards Due</p>
                      <Badge variant="info">{deck.cardsDue}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          title="Create Flashcard"
          onClose={() => {
            setShowCreateModal(false);
            setFront('');
            setBack('');
            setHint('');
            setError(null);
          }}
        >
          <form onSubmit={handleCreateFlashcard} className="space-y-4">
            <div>
              <label htmlFor="front" className="block text-sm font-medium text-gray-300 mb-2">
                Front <span className="text-red-400">*</span>
              </label>
              <Textarea
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={3}
                className="w-full"
                placeholder="Enter the front of the card"
                required
              />
            </div>

            <div>
              <label htmlFor="back" className="block text-sm font-medium text-gray-300 mb-2">
                Back <span className="text-red-400">*</span>
              </label>
              <Textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={3}
                className="w-full"
                placeholder="Enter the back of the card"
                required
              />
            </div>

            <div>
              <label htmlFor="hint" className="block text-sm font-medium text-gray-300 mb-2">
                Hint (optional)
              </label>
              <Textarea
                id="hint"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                rows={2}
                className="w-full"
                placeholder="Enter a hint (optional)"
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
                onClick={() => {
                  setShowCreateModal(false);
                  setFront('');
                  setBack('');
                  setHint('');
                  setError(null);
                }}
                disabled={createFlashcard.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!front.trim() || !back.trim() || createFlashcard.isPending}
                isLoading={createFlashcard.isPending}
              >
                Create Card
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}


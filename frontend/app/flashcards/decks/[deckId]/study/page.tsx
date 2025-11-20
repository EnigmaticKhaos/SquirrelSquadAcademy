'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent, Button, ProgressBar, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import { useStudySession, useReviewFlashcard } from '@/hooks/useFlashcards';

export default function StudySessionPage() {
  const params = useParams();
  const router = useRouter();
  const { deckId } = params as { deckId: string };
  const { data, isLoading, error } = useStudySession({ deckId, newCardsLimit: 10, reviewCardsLimit: 20 });
  const reviewMutation = useReviewFlashcard();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  const allCards = useMemo(() => {
    if (!data) return [];
    return [...(data.reviewCards || []), ...(data.newCards || [])];
  }, [data]);

  const currentCard = allCards[currentCardIndex];
  const totalCards = allCards.length;
  const progress = totalCards > 0 ? ((currentCardIndex + 1) / totalCards) * 100 : 0;

  const handleNext = async (correct: boolean) => {
    if (!currentCard) return;

    try {
      await reviewMutation.mutateAsync({ id: currentCard._id, result: correct ? 'correct' : 'incorrect' });
      
      if (correct) {
        setScore({ ...score, correct: score.correct + 1 });
      } else {
        setScore({ ...score, incorrect: score.incorrect + 1 });
      }

      if (currentCardIndex < totalCards - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
      } else {
        // Session complete
        router.push('/flashcards/decks/' + deckId);
      }
    } catch (error) {
      console.error('Failed to review card:', error);
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

  if (error || !data || totalCards === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="p-6">
                <ErrorMessage message={error ? "Failed to load study session. Please try again later." : "No cards available for study."} />
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
              { label: 'Flashcards', href: '/flashcards' },
              { label: 'Deck', href: '/flashcards/decks/' + deckId },
              { label: 'Study' },
            ]}
          />

          <div className="mt-8">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Card {currentCardIndex + 1} of {totalCards}
                </span>
                <span className="text-sm text-gray-400">
                  ✓ {score.correct} | ✗ {score.incorrect}
                </span>
              </div>
              <ProgressBar value={progress} showLabel />
            </div>

            <Card className="mb-6">
              <CardContent className="p-12">
                <div
                  className="min-h-[300px] cursor-pointer"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className="text-center">
                    {!isFlipped ? (
                      <>
                        <p className="mb-4 text-sm font-medium text-gray-400">Front</p>
                        <h2 className="text-2xl font-semibold text-gray-100">{currentCard.front}</h2>
                        {currentCard.hint && (
                          <p className="mt-4 text-sm text-gray-400 italic">Hint: {currentCard.hint}</p>
                        )}
                        <p className="mt-4 text-sm text-gray-500">Click to flip</p>
                      </>
                    ) : (
                      <>
                        <p className="mb-4 text-sm font-medium text-gray-400">Back</p>
                        <h2 className="text-2xl font-semibold text-gray-100">{currentCard.back}</h2>
                        <p className="mt-4 text-sm text-gray-500">Click to flip back</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {isFlipped && (
              <div className="flex justify-center gap-4">
                <Button
                  variant="danger"
                  onClick={() => handleNext(false)}
                  size="lg"
                  disabled={reviewMutation.isPending}
                >
                  Incorrect
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleNext(true)}
                  size="lg"
                  disabled={reviewMutation.isPending}
                >
                  Correct
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


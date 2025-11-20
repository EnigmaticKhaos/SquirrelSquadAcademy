'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent, Button, ProgressBar, LoadingSpinner } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function StudySessionPage() {
  const params = useParams();
  const router = useRouter();
  const { deckId } = params as { deckId: string };
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  // Mock cards
  const cards = [
    { front: 'What is React?', back: 'A JavaScript library for building user interfaces' },
    { front: 'What is JSX?', back: 'JavaScript XML - a syntax extension for JavaScript' },
  ];

  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  const handleNext = (correct: boolean) => {
    if (correct) {
      setScore({ ...score, correct: score.correct + 1 });
    } else {
      setScore({ ...score, incorrect: score.incorrect + 1 });
    }

    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      // Session complete
      router.push(`/flashcards/decks/${deckId}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Flashcards', href: '/flashcards' },
              { label: 'Deck', href: `/flashcards/decks/${deckId}` },
              { label: 'Study' },
            ]}
          />

          <div className="mt-8">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Card {currentCardIndex + 1} of {cards.length}
                </span>
                <span className="text-sm text-gray-500">
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
                        <p className="mb-4 text-sm font-medium text-gray-500">Front</p>
                        <h2 className="text-2xl font-semibold">{currentCard.front}</h2>
                        <p className="mt-4 text-sm text-gray-500">Click to flip</p>
                      </>
                    ) : (
                      <>
                        <p className="mb-4 text-sm font-medium text-gray-500">Back</p>
                        <h2 className="text-2xl font-semibold">{currentCard.back}</h2>
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
                >
                  Incorrect
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleNext(true)}
                  size="lg"
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


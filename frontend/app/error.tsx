'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Button, Card, CardContent, ErrorMessage } from '@/components/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleReset = () => {
    reset();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-100">Something went wrong!</h2>
            <ErrorMessage message={error.message || 'An unexpected error occurred'} />
            <div className="mt-6 flex gap-3">
              <Button onClick={handleReset} variant="primary">
                Try again
              </Button>
              <Link href="/">
                <Button variant="outline">Go Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


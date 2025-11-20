'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button, Card, CardContent } from '@/components/ui';

export default function NotFound() {
  const router = useRouter();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <h1 className="mb-4 text-6xl font-bold text-gray-900">404</h1>
            <h2 className="mb-4 text-2xl font-semibold text-gray-700">Page Not Found</h2>
            <p className="mb-6 text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="primary">Go Home</Button>
              </Link>
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


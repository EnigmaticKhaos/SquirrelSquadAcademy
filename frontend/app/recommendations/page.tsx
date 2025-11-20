'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner, ErrorMessage, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-600">Please log in to view personalized recommendations</p>
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
            title="Recommendations"
            description="Personalized course and learning path recommendations for you"
          />

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isLoading && recommendations.length === 0 && (
            <EmptyState
              title="No recommendations yet"
              description="Complete some courses to get personalized recommendations"
            />
          )}

          {!isLoading && recommendations.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((item) => (
                <Card key={item._id} hover>
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


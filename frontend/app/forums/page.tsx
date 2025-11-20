'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, LoadingSpinner, ErrorMessage, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function ForumsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Forums"
            description="Join discussions and get help from the community"
          />

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isLoading && categories.length === 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card hover>
                <CardHeader>
                  <CardTitle>General Discussion</CardTitle>
                  <CardDescription>General topics and discussions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>0 threads</span>
                    <span>0 posts</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!isLoading && categories.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link key={category._id} href={`/forums/${category._id}`}>
                  <Card hover className="h-full">
                    <CardHeader>
                      <CardTitle>{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription>{category.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{category.threadCount} threads</span>
                        <span>{category.postCount} posts</span>
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


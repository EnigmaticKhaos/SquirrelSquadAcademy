'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent, LoadingSpinner, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function SavedPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-600">Please log in to view your saved content</p>
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
            title="Saved Content"
            description="Your bookmarked courses, posts, and resources"
          />

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            {isLoading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {!isLoading && savedItems.length === 0 && (
              <TabsContent value={activeTab} className="mt-6">
                <EmptyState
                  title="No saved items"
                  description={`You haven't saved any ${activeTab === 'all' ? 'content' : activeTab} yet`}
                />
              </TabsContent>
            )}

            {!isLoading && savedItems.length > 0 && (
              <TabsContent value={activeTab} className="mt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {savedItems.map((item) => (
                    <Card key={item._id} hover>
                      <CardContent className="p-4">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}


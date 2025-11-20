'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent, SearchBar, LoadingSpinner, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      setIsLoading(true);
      // Perform search
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader title="Search" description="Find courses, users, posts, and more" />

          <div className="mb-6">
            <SearchBar
              placeholder="Search for courses, users, posts..."
              value={query}
              onChange={setQuery}
              onSearch={handleSearch}
              className="max-w-2xl"
            />
          </div>

          {query && (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
              </TabsList>

              {isLoading && (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              )}

              {!isLoading && (
                <TabsContent value="all" className="mt-6">
                  <div className="space-y-4">
                    {results.courses?.map((course: any) => (
                      <Link key={course._id} href={`/courses/${course._id}`}>
                        <Card hover>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-100">{course.title}</h3>
                            <p className="text-sm text-gray-400">{course.description}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}

          {!query && (
            <EmptyState
              title="Start searching"
              description="Enter a search query to find courses, users, posts, and more"
            />
          )}
        </div>
      </main>
    </div>
  );
}


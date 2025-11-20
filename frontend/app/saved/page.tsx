'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useSavedContent, useUnsaveContent } from '@/hooks/useSavedContent';
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent, LoadingSpinner, EmptyState, Button, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { SavedContentType } from '@/lib/api/savedContent';

export default function SavedPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const contentType = activeTab === 'all' ? undefined : activeTab as SavedContentType;
  
  const { data, isLoading } = useSavedContent({ contentType });
  const unsaveContent = useUnsaveContent();
  
  const savedItems = data?.data || [];

  const handleUnsave = async (contentType: SavedContentType, contentId: string) => {
    if (!confirm('Are you sure you want to remove this from your saved content?')) return;
    try {
      await unsaveContent.mutateAsync({ contentType, contentId });
    } catch (error) {
      console.error('Failed to unsave content:', error);
    }
  };

  const getContentLink = (item: any) => {
    switch (item.contentType) {
      case 'course':
        return '/courses/' + item.contentId;
      case 'post':
        return '/feed';
      case 'project':
        return '/projects/' + item.contentId;
      case 'forum_post':
        return '/forums';
      default:
        return '#';
    }
  };

  const getContentTitle = (item: any) => {
    if (item.content?.title) return item.content.title;
    if (item.content?.name) return item.content.name;
    return 'Untitled';
  };

  const getContentDescription = (item: any) => {
    if (item.content?.description) return item.content.description;
    if (item.content?.content) return item.content.content.substring(0, 100) + '...';
    return '';
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <p className="mb-4 text-center text-gray-400">Please log in to view your saved content</p>
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
                  {savedItems.map((item: any) => (
                    <Card key={item._id} hover={true} className="h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" size="sm">{item.contentType}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnsave(item.contentType, item.contentId)}
                            disabled={unsaveContent.isPending}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </Button>
                        </div>
                        <Link href={getContentLink(item)}>
                          <CardTitle className="text-lg text-gray-100 mb-2 hover:text-blue-400">
                            {getContentTitle(item)}
                          </CardTitle>
                        </Link>
                        <p className="mt-2 text-sm text-gray-400 line-clamp-3">
                          {getContentDescription(item)}
                        </p>
                        {item.tags && item.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag: string) => (
                              <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
                            ))}
                          </div>
                        )}
                        {item.folder && (
                          <p className="mt-2 text-xs text-gray-500">Folder: {item.folder}</p>
                        )}
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


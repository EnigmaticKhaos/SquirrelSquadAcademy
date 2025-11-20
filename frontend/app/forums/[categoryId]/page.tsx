'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, Badge, LoadingSpinner } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function ForumCategoryPage() {
  const params = useParams();
  const { categoryId } = params as { categoryId: string };

  // Mock threads
  const threads = [
    {
      _id: '1',
      title: 'Welcome to the forum!',
      author: { username: 'user1', profilePhoto: null },
      replyCount: 5,
      viewCount: 100,
      lastReply: { author: { username: 'user2' }, createdAt: new Date().toISOString() },
      isPinned: true,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Forums', href: '/forums' },
              { label: 'Category' },
            ]}
          />

          <div className="mt-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Forum Category</h1>
            <Link href={`/forums/${categoryId}/create`}>
              <Button>New Thread</Button>
            </Link>
          </div>

          <Card className="mt-6">
            <CardContent className="p-0">
              <div className="divide-y">
                {threads.map((thread) => (
                  <Link key={thread._id} href={`/forums/${categoryId}/threads/${thread._id}`}>
                    <div className="flex items-center gap-4 p-4 hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {thread.isPinned && <Badge variant="warning">Pinned</Badge>}
                          <h3 className="font-semibold">{thread.title}</h3>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                          <span>By {thread.author.username}</span>
                          <span>{thread.replyCount} replies</span>
                          <span>{thread.viewCount} views</span>
                        </div>
                      </div>
                      {thread.lastReply && (
                        <div className="text-right text-sm text-gray-500">
                          <p>Last reply by {thread.lastReply.author.username}</p>
                          <p>{new Date(thread.lastReply.createdAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


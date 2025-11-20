'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, Textarea, Button, Avatar, Badge, LoadingSpinner, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;
    // Create post logic
    setNewPost('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader title="Feed" description="See what's happening in the community" />

          {user && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar src={user.profilePhoto} name={user.username} size="md" />
                  <div className="flex-1">
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      rows={3}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button onClick={handleCreatePost} disabled={!newPost.trim()}>
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isLoading && posts.length === 0 && (
            <EmptyState
              title="No posts yet"
              description="Be the first to share something with the community"
            />
          )}

          {!isLoading && posts.length > 0 && (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post._id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar src={post.user?.profilePhoto} name={post.user?.username} size="md" />
                      <div>
                        <p className="font-medium text-gray-100">{post.user?.username}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 whitespace-pre-wrap text-gray-300">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <button className="hover:text-blue-400 transition-colors">Like ({post.likesCount || 0})</button>
                      <button className="hover:text-blue-400 transition-colors">Comment ({post.commentsCount || 0})</button>
                      <button className="hover:text-blue-400 transition-colors">Share</button>
                    </div>
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


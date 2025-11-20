'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Card, CardContent, Button, Avatar, Badge, LoadingSpinner, ErrorMessage, EmptyState } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import { useCourseForumPosts } from '@/hooks/useForums';
import { useCourse } from '@/hooks/useCourses';

export default function ForumCategoryPage() {
  const params = useParams();
  const { categoryId } = params as { categoryId: string };
  // categoryId is actually courseId in the backend
  const courseId = categoryId;
  
  const { data: course } = useCourse(courseId);
  const { data, isLoading, error } = useCourseForumPosts(courseId, {
    parentPostId: null, // Only top-level posts
    sortBy: 'recent_activity',
    limit: 50,
    offset: 0,
  });

  const posts = data?.posts || [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Forums', href: '/forums' },
              { label: course?.title || 'Course Forum' },
            ]}
          />

          <div className="mt-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-100">
              {course?.title || 'Course'} Forum
            </h1>
            <Link href={'/forums/' + categoryId + '/create'}>
              <Button>New Thread</Button>
            </Link>
          </div>

          {isLoading && (
            <div className="mt-6 flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <ErrorMessage message="Failed to load forum posts. Please try again later." />
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && posts.length === 0 && (
            <Card className="mt-6">
              <CardContent className="p-12 text-center">
                <EmptyState
                  title="No posts yet"
                  description="Be the first to start a discussion"
                />
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && posts.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-700">
                  {posts.map((post) => {
                    const author = typeof post.author === 'string' ? null : post.author;
                    return (
                      <Link key={post._id} href={'/forums/' + categoryId + '/threads/' + post._id}>
                        <div className="flex items-center gap-4 p-4 hover:bg-gray-800 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {post.isPinned && <Badge variant="warning">Pinned</Badge>}
                              {post.type === 'question' && <Badge variant="info">Question</Badge>}
                              {post.type === 'announcement' && <Badge variant="danger">Announcement</Badge>}
                              {post.isResolved && <Badge variant="success">Resolved</Badge>}
                              <h3 className="font-semibold text-gray-100">{post.title}</h3>
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-400">
                              {author && (
                                <>
                                  <Avatar
                                    src={author.profilePhoto || undefined}
                                    name={author.username}
                                    size="sm"
                                  />
                                  <span>By {author.username}</span>
                                </>
                              )}
                              <span>{post.repliesCount} replies</span>
                              <span>{post.views} views</span>
                              {post.upvotes > 0 && (
                                <span className="text-green-400">↑ {post.upvotes}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-400">
                            <p>Last activity: {new Date(post.lastActivityAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}


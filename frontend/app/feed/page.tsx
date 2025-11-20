'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { usePosts, useCreatePost, useLikePost, useUnlikePost } from '@/hooks/usePosts';
import { useComments, useCreateComment } from '@/hooks/useComments';
import { Card, CardContent, CardHeader, Textarea, Button, Avatar, Badge, LoadingSpinner, EmptyState, Modal } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { Post, Comment } from '@/types';

export default function FeedPage() {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const { data: postsData, isLoading } = usePosts({ page: 1, limit: 20 });
  const createPost = useCreatePost();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const { data: commentsData } = useComments(selectedPost?._id || '', { page: 1, limit: 10 });
  const createComment = useCreateComment();

  const posts: Post[] = postsData ? (postsData as any).data || [] : [];
  const comments: Comment[] = commentsData ? (commentsData as any).data || [] : [];

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;
    try {
      await createPost.mutateAsync({ content: newPost, type: 'text' });
      setNewPost('');
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await likePost.mutateAsync(postId);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim() || !selectedPost) return;
    try {
      await createComment.mutateAsync({ postId: selectedPost._id, data: { content: commentContent } });
      setCommentContent('');
      setSelectedPost(null);
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
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
                      <Button
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || createPost.isPending}
                        isLoading={createPost.isPending}
                      >
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
              {posts.map((post) => {
                const postUser = typeof post.user === 'string' ? null : post.user;
                return (
                  <Card key={post._id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={postUser?.profilePhoto || undefined}
                          name={postUser?.username || 'User'}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-gray-100">{postUser?.username || 'User'}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 whitespace-pre-wrap text-gray-300">{post.content}</p>
                      {post.media && post.media.length > 0 && (
                        <div className="mb-4 space-y-2">
                          {post.media.map((media, index) => (
                            <div key={index}>
                              {media.type.startsWith('image/') && (
                                <img src={media.url} alt={`Post media ${index + 1}`} className="rounded-lg max-w-full" />
                              )}
                              {media.type.startsWith('video/') && (
                                <video src={media.url} controls className="rounded-lg max-w-full" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <button
                          onClick={() => handleLikePost(post._id)}
                          disabled={likePost.isPending || unlikePost.isPending}
                          className="hover:text-blue-400 transition-colors disabled:opacity-50"
                        >
                          Like ({post.likesCount || 0})
                        </button>
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="hover:text-blue-400 transition-colors"
                        >
                          Comment ({post.commentsCount || 0})
                        </button>
                        <button className="hover:text-blue-400 transition-colors">
                          Share ({post.sharesCount || 0})
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedPost && (
            <Modal
              isOpen={!!selectedPost}
              title="Comments"
              onClose={() => {
                setSelectedPost(null);
                setCommentContent('');
              }}
            >
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No comments yet</p>
                  ) : (
                    comments.map((comment) => {
                      const commentUser = typeof comment.user === 'string' ? null : comment.user;
                      return (
                        <div key={comment._id} className="border-b border-gray-700 pb-3">
                          <div className="flex items-start gap-3">
                            <Avatar
                              src={commentUser?.profilePhoto || undefined}
                              name={commentUser?.username || 'User'}
                              size="sm"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-100 text-sm">
                                  {commentUser?.username || 'User'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                              <button className="text-xs text-gray-400 hover:text-blue-400 mt-1">
                                Like ({comment.likesCount || 0})
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPost(null);
                        setCommentContent('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleComment}
                      disabled={!commentContent.trim() || createComment.isPending}
                      isLoading={createComment.isPending}
                    >
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </main>
    </div>
  );
}


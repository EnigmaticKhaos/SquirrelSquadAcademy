'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, Button, Textarea, Card, CardContent } from '@/components/ui';
import type { Comment } from '@/types';

export interface CommentSectionProps {
  postId?: string;
  comments: Comment[];
  onCreateComment: (content: string, parentComment?: string) => Promise<void>;
  onLikeComment?: (commentId: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  onCreateComment,
  onLikeComment,
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    await onCreateComment(newComment, replyingTo || undefined);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return;
    
    await onCreateComment(replyContent, parentId);
    setReplyContent('');
    setReplyingTo(null);
  };

  return (
    <div className="space-y-4">
      {user && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <Avatar src={user.profilePhoto} name={user.username} size="md" />
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="flex-1"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={!newComment.trim()}>
                  Post Comment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment._id}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar
                  src={typeof comment.user === 'object' ? comment.user.profilePhoto : undefined}
                  name={typeof comment.user === 'object' ? comment.user.username : 'User'}
                  size="md"
                />
                <div className="flex-1">
                  <div className="mb-2">
                    <p className="font-medium">
                      {typeof comment.user === 'object' ? comment.user.username : 'User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="mb-3 whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex items-center gap-4 text-sm">
                    {onLikeComment && (
                      <button
                        onClick={() => onLikeComment(comment._id)}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        Like ({comment.likesCount || 0})
                      </button>
                    )}
                    <button
                      onClick={() => setReplyingTo(comment._id)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      Reply
                    </button>
                  </div>

                  {replyingTo === comment._id && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReply(comment._id)}
                          disabled={!replyContent.trim()}
                        >
                          Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-8 space-y-3 border-l-2 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="flex gap-3">
                          <Avatar
                            src={typeof reply.user === 'object' ? reply.user.profilePhoto : undefined}
                            name={typeof reply.user === 'object' ? reply.user.username : 'User'}
                            size="sm"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {typeof reply.user === 'object' ? reply.user.username : 'User'}
                            </p>
                            <p className="text-sm">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};


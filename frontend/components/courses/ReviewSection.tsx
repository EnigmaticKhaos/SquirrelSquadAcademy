'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseReviewsApi } from '@/lib/api';
import { Card, CardContent, Rating, Button, Textarea, Input, Modal, Avatar, Badge, LoadingSpinner, ErrorMessage } from '@/components/ui';
import type { CourseReview, PaginatedResponse } from '@/types';

export interface ReviewSectionProps {
  courseId: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ courseId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ['reviews', courseId],
    queryFn: () => courseReviewsApi.getReviews(courseId, { limit: 10 }).then(res => res.data.data),
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: { rating: number; title?: string; content: string }) =>
      courseReviewsApi.createReview(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', courseId] });
      setShowReviewForm(false);
      setTitle('');
      setContent('');
      setRating(5);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    await createReviewMutation.mutateAsync({
      rating,
      title: title || undefined,
      content,
    });
  };

  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        {user && (
          <Button onClick={() => setShowReviewForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {showReviewForm && (
        <Modal
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          title="Write a Review"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={createReviewMutation.isPending}
              >
                Submit Review
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <Rating value={rating} onChange={setRating} />
            </div>
            <Input
              label="Title (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your review"
            />
            <Textarea
              label="Review"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Share your experience with this course..."
              required
            />
          </form>
        </Modal>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <ErrorMessage message="Failed to load reviews" />
      )}

      {reviews && reviews.data && reviews.data.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No reviews yet. Be the first to review this course!</p>
          </CardContent>
        </Card>
      )}

      {reviews && reviews.data && reviews.data.length > 0 && (
        <div className="space-y-4">
          {reviews.data.map((review: CourseReview) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={undefined}
                      name="User"
                      size="md"
                    />
                    <div>
                      <p className="font-medium">User</p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Rating value={review.rating} readonly />
                </div>
                {review.title && (
                  <h3 className="mb-2 text-lg font-semibold">{review.title}</h3>
                )}
                <p className="mb-4 whitespace-pre-wrap text-gray-700">{review.content}</p>
                <div className="flex items-center gap-4 text-sm">
                  <button className="text-gray-600 hover:text-blue-600">
                    Helpful ({review.helpfulCount})
                  </button>
                  <button className="text-gray-600 hover:text-blue-600">
                    Not Helpful ({review.notHelpfulCount})
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


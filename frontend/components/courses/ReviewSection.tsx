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
  const [difficultyRating, setDifficultyRating] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: reviews, isLoading, error: reviewsError } = useQuery({
    queryKey: ['reviews', courseId],
    queryFn: async () => {
      const response = await courseReviewsApi.getReviews(courseId, { limit: 10 });
      const apiResponse = response.data;
      if (apiResponse.data) {
        return apiResponse.data;
      }
      return {
        data: (apiResponse as any).reviews || [],
        pagination: {
          page: 1,
          limit: 10,
          total: (apiResponse as any).total || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    },
    placeholderData: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: { rating: number; difficultyRating?: number; title?: string; content: string }) =>
      courseReviewsApi.createReview(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setShowReviewForm(false);
      setTitle('');
      setContent('');
      setRating(5);
      setDifficultyRating(undefined);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to submit review');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!content.trim()) {
      setError('Review content is required');
      return;
    }
    
    setError(null);
    await createReviewMutation.mutateAsync({
      rating,
      difficultyRating,
      title: title.trim() || undefined,
      content: content.trim(),
    });
  };

  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-100">Reviews</h2>
        {user && (
          <Button onClick={() => setShowReviewForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {showReviewForm && (
        <Modal
          isOpen={showReviewForm}
          onClose={() => {
            setShowReviewForm(false);
            setError(null);
          }}
          title="Write a Review"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rating <span className="text-red-400">*</span>
              </label>
              <Rating value={rating} onChange={setRating} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty Rating (Optional)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Too Easy</span>
                <Rating 
                  value={difficultyRating || 0} 
                  onChange={(val) => setDifficultyRating(val > 0 ? val : undefined)} 
                />
                <span className="text-xs text-gray-400">Too Hard</span>
              </div>
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
            
            {error && (
              <div className="rounded-md bg-red-900/50 border border-red-800 p-4">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowReviewForm(false);
                  setError(null);
                }}
                disabled={createReviewMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!content.trim() || createReviewMutation.isPending}
                isLoading={createReviewMutation.isPending}
              >
                Submit Review
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {reviewsError && (
        <ErrorMessage message="Failed to load reviews" />
      )}

      {!isLoading && !reviewsError && reviews && reviews.data && reviews.data.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">No reviews yet. Be the first to review this course!</p>
            {user && (
              <Button 
                className="mt-4" 
                onClick={() => setShowReviewForm(true)}
              >
                Write the First Review
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && !reviewsError && reviews && reviews.data && reviews.data.length > 0 && (
        <div className="space-y-4">
          {reviews.data.map((review: CourseReview) => {
            const reviewUser = typeof review.user === 'object' && review.user !== null ? review.user : null;
            return (
              <Card key={review._id}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={reviewUser?.profilePhoto || undefined}
                        name={reviewUser?.username || 'User'}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-100">{reviewUser?.username || 'User'}</p>
                          {review.isVerified && (
                            <Badge variant="success" size="sm">Verified</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Rating value={review.rating} readonly />
                  </div>
                  {review.title && (
                    <h3 className="mb-2 text-lg font-semibold text-gray-100">{review.title}</h3>
                  )}
                  <p className="mb-4 whitespace-pre-wrap text-gray-300">{review.content}</p>
                  {review.difficultyRating && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-1">Difficulty: {review.difficultyRating}/5</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <button className="text-gray-400 hover:text-blue-400 transition-colors">
                      Helpful ({review.helpfulCount || 0})
                    </button>
                    <button className="text-gray-400 hover:text-blue-400 transition-colors">
                      Not Helpful ({review.notHelpfulCount || 0})
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};


import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  createCourseReview,
  updateCourseReview,
  deleteCourseReview,
  getCourseReviews,
  getUserCourseReview,
  voteOnReview,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  getUserWishlist,
} from '../services/courseReviewService';

// @desc    Create course review
// @route   POST /api/course-reviews
// @access  Private
export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { courseId, rating, difficultyRating, title, content } = req.body;

  if (!courseId || !rating || !content) {
    return res.status(400).json({
      success: false,
      message: 'Course ID, rating, and content are required',
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5',
    });
  }

  try {
    const review = await createCourseReview(userId, {
      courseId,
      rating,
      difficultyRating,
      title,
      content,
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create review',
    });
  }
});

// @desc    Update course review
// @route   PUT /api/course-reviews/:id
// @access  Private
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { rating, difficultyRating, title, content } = req.body;

  const review = await updateCourseReview(id, userId, {
    rating,
    difficultyRating,
    title,
    content,
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or unauthorized',
    });
  }

  res.json({
    success: true,
    message: 'Review updated successfully',
    review,
  });
});

// @desc    Delete course review
// @route   DELETE /api/course-reviews/:id
// @access  Private
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const deleted = await deleteCourseReview(id, userId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or unauthorized',
    });
  }

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
});

// @desc    Get reviews for a course
// @route   GET /api/course-reviews/course/:courseId
// @access  Public
export const getByCourse = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const {
    rating,
    sortBy = 'newest',
    verifiedOnly,
    limit = 20,
    offset = 0,
  } = req.query;

  const result = await getCourseReviews(courseId, {
    rating: rating ? Number(rating) : undefined,
    sortBy: sortBy as any,
    verifiedOnly: verifiedOnly === 'true',
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: result.reviews.length,
    total: result.total,
    averageRating: result.averageRating,
    ratingDistribution: result.ratingDistribution,
    reviews: result.reviews,
  });
});

// @desc    Get user's review for a course
// @route   GET /api/course-reviews/course/:courseId/user
// @access  Private
export const getByUser = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  const review = await getUserCourseReview(userId, courseId);

  res.json({
    success: true,
    review: review || null,
  });
});

// @desc    Vote on review helpfulness
// @route   POST /api/course-reviews/:id/vote
// @access  Private
export const vote = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { isHelpful } = req.body;

  if (typeof isHelpful !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isHelpful (boolean) is required',
    });
  }

  const result = await voteOnReview(id, userId, isHelpful);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message,
    });
  }

  res.json({
    success: true,
    message: result.message,
  });
});

// @desc    Add course to wishlist
// @route   POST /api/course-reviews/wishlist/:courseId
// @access  Private
export const addWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();
  const { notifyOnSale, notifyOnRelease } = req.body;

  try {
    const wishlistItem = await addToWishlist(userId, courseId, {
      notifyOnSale,
      notifyOnRelease,
    });

    res.status(201).json({
      success: true,
      message: 'Course added to wishlist',
      wishlistItem,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to add to wishlist',
    });
  }
});

// @desc    Remove course from wishlist
// @route   DELETE /api/course-reviews/wishlist/:courseId
// @access  Private
export const removeWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  const removed = await removeFromWishlist(userId, courseId);

  if (!removed) {
    return res.status(404).json({
      success: false,
      message: 'Course not in wishlist',
    });
  }

  res.json({
    success: true,
    message: 'Course removed from wishlist',
  });
});

// @desc    Check if course is in wishlist
// @route   GET /api/course-reviews/wishlist/:courseId/check
// @access  Private
export const checkWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  const inWishlist = await isInWishlist(userId, courseId);

  res.json({
    success: true,
    inWishlist,
  });
});

// @desc    Get user's wishlist
// @route   GET /api/course-reviews/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { limit = 50, offset = 0 } = req.query;

  const { wishlist, total } = await getUserWishlist(userId, {
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: wishlist.length,
    total,
    wishlist,
  });
});


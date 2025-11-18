import CourseReview from '../models/CourseReview';
import Course from '../models/Course';
import CourseCompletion from '../models/CourseCompletion';
import CourseWishlist from '../models/CourseWishlist';
import { moderateContent } from './ai/moderationService';
import logger from '../utils/logger';

/**
 * Create a course review
 */
export const createCourseReview = async (
  userId: string,
  data: {
    courseId: string;
    rating: number;
    difficultyRating?: number;
    title?: string;
    content: string;
  }
): Promise<CourseReview> => {
  try {
    const course = await Course.findById(data.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if user already reviewed
    const existingReview = await CourseReview.findOne({
      course: data.courseId,
      user: userId,
    });

    if (existingReview) {
      throw new Error('You have already reviewed this course');
    }

    // Check if user completed the course (for verified badge)
    const completion = await CourseCompletion.findOne({
      user: userId,
      course: data.courseId,
      passed: true,
    });
    const isVerified = !!completion;

    // Moderate content
    const moderationResult = await moderateContent(data.content);
    if (moderationResult.isFlagged && moderationResult.severity === 'high') {
      throw new Error('Review contains inappropriate content');
    }

    const review = await CourseReview.create({
      course: data.courseId,
      user: userId,
      rating: data.rating,
      difficultyRating: data.difficultyRating,
      title: data.title,
      content: data.content,
      isVerified,
      isApproved: moderationResult.severity !== 'high',
    });

    // Update course average rating
    await updateCourseRating(data.courseId);

    logger.info(`Course review created: ${review._id} by user ${userId}`);
    return review;
  } catch (error) {
    logger.error('Error creating course review:', error);
    throw error;
  }
};

/**
 * Update course review
 */
export const updateCourseReview = async (
  reviewId: string,
  userId: string,
  updates: {
    rating?: number;
    difficultyRating?: number;
    title?: string;
    content?: string;
  }
): Promise<CourseReview | null> => {
  try {
    const review = await CourseReview.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return null;
    }

    // Moderate content if updated
    if (updates.content) {
      const moderationResult = await moderateContent(updates.content);
      if (moderationResult.isFlagged && moderationResult.severity === 'high') {
        throw new Error('Review contains inappropriate content');
      }
      updates.isApproved = moderationResult.severity !== 'high';
    }

    Object.assign(review, updates);
    await review.save();

    // Update course average rating
    await updateCourseRating(review.course.toString());

    return review;
  } catch (error) {
    logger.error('Error updating course review:', error);
    throw error;
  }
};

/**
 * Delete course review
 */
export const deleteCourseReview = async (
  reviewId: string,
  userId: string
): Promise<boolean> => {
  try {
    const review = await CourseReview.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return false;
    }

    const courseId = review.course.toString();
    await review.deleteOne();

    // Update course average rating
    await updateCourseRating(courseId);

    logger.info(`Course review deleted: ${reviewId} by user ${userId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting course review:', error);
    return false;
  }
};

/**
 * Get reviews for a course
 */
export const getCourseReviews = async (
  courseId: string,
  options?: {
    rating?: number;
    sortBy?: 'newest' | 'oldest' | 'most_helpful' | 'highest_rating' | 'lowest_rating';
    verifiedOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<{ reviews: CourseReview[]; total: number; averageRating: number; ratingDistribution: any }> => {
  try {
    const query: any = {
      course: courseId,
      isPublic: true,
      isApproved: true,
    };

    if (options?.rating) {
      query.rating = options.rating;
    }

    if (options?.verifiedOnly) {
      query.isVerified = true;
    }

    const total = await CourseReview.countDocuments(query);

    let sortOptions: any = {};
    switch (options?.sortBy) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'most_helpful':
        sortOptions = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'highest_rating':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case 'lowest_rating':
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const reviews = await CourseReview.find(query)
      .populate('user', 'username profilePhoto level')
      .sort(sortOptions)
      .skip(options?.offset || 0)
      .limit(options?.limit || 20);

    // Calculate average rating and distribution
    const allReviews = await CourseReview.find({
      course: courseId,
      isPublic: true,
      isApproved: true,
    }).select('rating');

    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    return {
      reviews,
      total,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };
  } catch (error) {
    logger.error('Error getting course reviews:', error);
    return { reviews: [], total: 0, averageRating: 0, ratingDistribution: {} };
  }
};

/**
 * Get user's review for a course
 */
export const getUserCourseReview = async (
  userId: string,
  courseId: string
): Promise<CourseReview | null> => {
  try {
    return await CourseReview.findOne({
      user: userId,
      course: courseId,
    }).populate('user', 'username profilePhoto');
  } catch (error) {
    logger.error('Error getting user course review:', error);
    return null;
  }
};

/**
 * Vote on review helpfulness
 */
export const voteOnReview = async (
  reviewId: string,
  userId: string,
  isHelpful: boolean
): Promise<{ success: boolean; message: string }> => {
  try {
    const review = await CourseReview.findById(reviewId);
    if (!review) {
      return { success: false, message: 'Review not found' };
    }

    // Users cannot vote on their own reviews
    if (review.user.toString() === userId) {
      return { success: false, message: 'Cannot vote on your own review' };
    }

    const helpfulIndex = review.helpfulVotes.findIndex(
      (id) => id.toString() === userId
    );
    const notHelpfulIndex = review.notHelpfulVotes.findIndex(
      (id) => id.toString() === userId
    );

    if (isHelpful) {
      if (helpfulIndex !== -1) {
        // Remove helpful vote
        review.helpfulVotes.splice(helpfulIndex, 1);
        review.helpfulCount -= 1;
      } else {
        // Add helpful vote, remove not helpful if exists
        if (notHelpfulIndex !== -1) {
          review.notHelpfulVotes.splice(notHelpfulIndex, 1);
          review.notHelpfulCount -= 1;
        }
        review.helpfulVotes.push(userId as any);
        review.helpfulCount += 1;
      }
    } else {
      if (notHelpfulIndex !== -1) {
        // Remove not helpful vote
        review.notHelpfulVotes.splice(notHelpfulIndex, 1);
        review.notHelpfulCount -= 1;
      } else {
        // Add not helpful vote, remove helpful if exists
        if (helpfulIndex !== -1) {
          review.helpfulVotes.splice(helpfulIndex, 1);
          review.helpfulCount -= 1;
        }
        review.notHelpfulVotes.push(userId as any);
        review.notHelpfulCount += 1;
      }
    }

    await review.save();
    return { success: true, message: 'Vote recorded' };
  } catch (error) {
    logger.error('Error voting on review:', error);
    return { success: false, message: 'Error voting on review' };
  }
};

/**
 * Update course average rating
 */
const updateCourseRating = async (courseId: string): Promise<void> => {
  try {
    const reviews = await CourseReview.find({
      course: courseId,
      isPublic: true,
      isApproved: true,
    }).select('rating');

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    await Course.findByIdAndUpdate(courseId, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length,
    });
  } catch (error) {
    logger.error('Error updating course rating:', error);
  }
};

/**
 * Add course to wishlist
 */
export const addToWishlist = async (
  userId: string,
  courseId: string,
  options?: {
    notifyOnSale?: boolean;
    notifyOnRelease?: boolean;
  }
): Promise<CourseWishlist> => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const existing = await CourseWishlist.findOne({
      user: userId,
      course: courseId,
    });

    if (existing) {
      // Update notification preferences
      if (options?.notifyOnSale !== undefined) {
        existing.notifyOnSale = options.notifyOnSale;
      }
      if (options?.notifyOnRelease !== undefined) {
        existing.notifyOnRelease = options.notifyOnRelease;
      }
      await existing.save();
      return existing;
    }

    const wishlistItem = await CourseWishlist.create({
      user: userId,
      course: courseId,
      notifyOnSale: options?.notifyOnSale !== undefined ? options.notifyOnSale : true,
      notifyOnRelease: options?.notifyOnRelease !== undefined ? options.notifyOnRelease : true,
    });

    logger.info(`Course added to wishlist: ${courseId} by user ${userId}`);
    return wishlistItem;
  } catch (error) {
    logger.error('Error adding course to wishlist:', error);
    throw error;
  }
};

/**
 * Remove course from wishlist
 */
export const removeFromWishlist = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  try {
    const result = await CourseWishlist.findOneAndDelete({
      user: userId,
      course: courseId,
    });

    return !!result;
  } catch (error) {
    logger.error('Error removing course from wishlist:', error);
    return false;
  }
};

/**
 * Check if course is in wishlist
 */
export const isInWishlist = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  try {
    const item = await CourseWishlist.findOne({
      user: userId,
      course: courseId,
    });
    return !!item;
  } catch (error) {
    logger.error('Error checking wishlist:', error);
    return false;
  }
};

/**
 * Get user's wishlist
 */
export const getUserWishlist = async (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ wishlist: CourseWishlist[]; total: number }> => {
  try {
    const total = await CourseWishlist.countDocuments({ user: userId });

    const wishlist = await CourseWishlist.find({ user: userId })
      .populate('course', 'title thumbnail price isFree difficulty estimatedDuration')
      .sort({ addedAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { wishlist, total };
  } catch (error) {
    logger.error('Error getting user wishlist:', error);
    return { wishlist: [], total: 0 };
  }
};


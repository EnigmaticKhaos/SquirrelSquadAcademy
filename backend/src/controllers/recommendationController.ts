import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import {
  getCourseRecommendations,
  getLearningPathRecommendations,
  getPricingSuggestion,
} from '../services/ai/recommendationService';

// @desc    Get AI course recommendations
// @route   GET /api/recommendations/courses
// @access  Private
export const getCourseRecommendationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { limit = 10, excludeEnrolled = 'true' } = req.query;

  const recommendations = await getCourseRecommendations(userId, {
    limit: Number(limit),
    excludeEnrolled: excludeEnrolled === 'true',
  });

  res.json({
    success: true,
    count: recommendations.length,
    recommendations,
  });
});

// @desc    Get AI learning path recommendations
// @route   GET /api/recommendations/learning-paths
// @access  Private
export const getLearningPathRecommendationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { limit = 5 } = req.query;

  const recommendations = await getLearningPathRecommendations(userId, {
    limit: Number(limit),
  });

  res.json({
    success: true,
    count: recommendations.length,
    recommendations,
  });
});

// @desc    Get AI pricing suggestion for a course
// @route   GET /api/recommendations/pricing/:courseId
// @access  Private/Admin
export const getPricingSuggestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  const suggestion = await getPricingSuggestion(courseId);

  res.json({
    success: true,
    suggestion,
  });
});


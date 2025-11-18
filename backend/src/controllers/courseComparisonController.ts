import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { compareCourses, getComparisonSummary } from '../services/courseComparisonService';

// @desc    Compare courses
// @route   POST /api/course-comparison
// @access  Public
export const compare = asyncHandler(async (req: Request, res: Response) => {
  const { courseIds } = req.body;

  if (!courseIds || !Array.isArray(courseIds)) {
    return res.status(400).json({
      success: false,
      message: 'courseIds array is required',
    });
  }

  if (courseIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'At least 2 courses are required for comparison',
    });
  }

  if (courseIds.length > 5) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 5 courses can be compared at once',
    });
  }

  try {
    const comparison = await compareCourses(courseIds);

    res.json({
      success: true,
      comparison,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to compare courses',
    });
  }
});

// @desc    Get comparison summary
// @route   POST /api/course-comparison/summary
// @access  Public
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const { courseIds } = req.body;

  if (!courseIds || !Array.isArray(courseIds)) {
    return res.status(400).json({
      success: false,
      message: 'courseIds array is required',
    });
  }

  if (courseIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'At least 2 courses are required for comparison',
    });
  }

  try {
    const result = await getComparisonSummary(courseIds);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to get comparison summary',
    });
  }
});


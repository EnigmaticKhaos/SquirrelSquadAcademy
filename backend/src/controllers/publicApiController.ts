import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateApiKey, ApiKeyRequest } from '../middleware/apiKeyAuth';
import Course from '../models/Course';
import Module from '../models/Module';
import Lesson from '../models/Lesson';
import { getOrSet, cacheKeys } from '../services/cacheService';

// @desc    Get all courses (public API)
// @route   GET /api/public/courses
// @access  Public (API key required)
export const getPublicCourses = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const {
    courseType,
    difficulty,
    category,
    tags,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  const query: any = {
    status: 'published', // Only published courses
  };

  if (courseType) query.courseType = courseType;
  if (difficulty) query.difficulty = difficulty;
  if (category) query.category = category;
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    query.tags = { $in: tagArray };
  }
  if (search) {
    query.$text = { $search: search as string };
  }

  const cacheKey = cacheKeys.courseList(JSON.stringify(query) + `:${page}:${limit}`);

  const result = await getOrSet(cacheKey, async () => {
    const skip = (Number(page) - 1) * Number(limit);

    const courses = await Course.find(query)
      .select('-versionHistory -createdBy -updatedBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Course.countDocuments(query);

    return {
      courses,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    };
  }, 1800); // Cache for 30 minutes

  res.json({
    success: true,
    count: result.courses.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    courses: result.courses,
  });
});

// @desc    Get single course (public API)
// @route   GET /api/public/courses/:id
// @access  Public (API key required)
export const getPublicCourse = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const { id } = req.params;

  const cacheKey = cacheKeys.course(id);

  const course = await getOrSet(cacheKey, async () => {
    const courseDoc = await Course.findById(id)
      .select('-versionHistory -createdBy -updatedBy')
      .populate({
        path: 'modules',
        select: '-createdBy -updatedBy',
        populate: {
          path: 'lessons',
          select: '-createdBy -updatedBy -content', // Don't include full content
        },
      })
      .lean();

    if (!courseDoc || courseDoc.status !== 'published') {
      return null;
    }

    return courseDoc;
  }, 3600); // Cache for 1 hour

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  res.json({
    success: true,
    course,
  });
});

// @desc    Get course modules (public API)
// @route   GET /api/public/courses/:id/modules
// @access  Public (API key required)
export const getPublicCourseModules = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const { id } = req.params;

  const cacheKey = cacheKeys.courseModules(id);

  const modules = await getOrSet(cacheKey, async () => {
    const course = await Course.findById(id).select('modules');
    if (!course || course.status !== 'published') {
      return null;
    }

    const modulesList = await Module.find({ _id: { $in: course.modules } })
      .select('-createdBy -updatedBy')
      .populate({
        path: 'lessons',
        select: '-createdBy -updatedBy -content',
      })
      .sort({ order: 1 })
      .lean();

    return modulesList;
  }, 3600); // Cache for 1 hour

  if (!modules) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  res.json({
    success: true,
    modules,
  });
});

// @desc    Get course statistics (public API)
// @route   GET /api/public/courses/:id/stats
// @access  Public (API key required)
export const getPublicCourseStats = asyncHandler(async (req: ApiKeyRequest, res: Response) => {
  const { id } = req.params;

  const cacheKey = cacheKeys.courseStats(id);

  const stats = await getOrSet(cacheKey, async () => {
    const course = await Course.findById(id).select('enrollmentCount completionCount passCount');
    if (!course || course.status !== 'published') {
      return null;
    }

    return {
      enrollmentCount: course.enrollmentCount || 0,
      completionCount: course.completionCount || 0,
      passCount: course.passCount || 0,
      passRate: course.completionCount > 0
        ? ((course.passCount || 0) / course.completionCount) * 100
        : 0,
    };
  }, 1800); // Cache for 30 minutes

  if (!stats) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  res.json({
    success: true,
    stats,
  });
});


import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  startLearningPath,
  updateLearningPathProgress,
  getLearningPathProgress,
  getUserLearningPaths,
  toggleLearningPathStatus,
  getNextCourse,
  getLearningPathWithProgress,
  canStartLearningPath,
} from '../services/learningPathService';
import { generateLearningPath } from '../services/ai/learningPathGenerationService';
import LearningPath from '../models/LearningPath';

// @desc    Get all learning paths
// @route   GET /api/learning-paths
// @access  Public
export const getLearningPaths = asyncHandler(async (req: Request, res: Response) => {
  const {
    type,
    difficulty,
    tags,
    category,
    search,
    isActive,
    page = 1,
    limit = 20,
  } = req.query;

  const query: any = {};
  if (type) query.type = type;
  if (difficulty) query.difficulty = difficulty;
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    query.tags = { $in: tagArray };
  }
  if (search) {
    query.$text = { $search: search as string };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const paths = await LearningPath.find(query)
    .populate('courses.course', 'title thumbnail difficulty estimatedDuration')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await LearningPath.countDocuments(query);

  res.json({
    success: true,
    count: paths.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    paths,
  });
});

// @desc    Get single learning path
// @route   GET /api/learning-paths/:id
// @access  Public
export const getLearningPath = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId } | undefined;
  const userId = userDoc?._id?.toString();

  const pathData = await getLearningPathWithProgress(id, userId);

  if (!pathData) {
    return res.status(404).json({
      success: false,
      message: 'Learning path not found',
    });
  }

  res.json({
    success: true,
    ...pathData,
  });
});

// @desc    Create learning path (Admin)
// @route   POST /api/learning-paths
// @access  Private/Admin
export const createLearningPath = asyncHandler(async (req: Request, res: Response) => {
  const path = await LearningPath.create(req.body);

  res.status(201).json({
    success: true,
    path,
  });
});

// @desc    Update learning path (Admin)
// @route   PUT /api/learning-paths/:id
// @access  Private/Admin
export const updateLearningPath = asyncHandler(async (req: Request, res: Response) => {
  const path = await LearningPath.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!path) {
    return res.status(404).json({
      success: false,
      message: 'Learning path not found',
    });
  }

  res.json({
    success: true,
    path,
  });
});

// @desc    Delete learning path (Admin)
// @route   DELETE /api/learning-paths/:id
// @access  Private/Admin
export const deleteLearningPath = asyncHandler(async (req: Request, res: Response) => {
  const path = await LearningPath.findById(req.params.id);

  if (!path) {
    return res.status(404).json({
      success: false,
      message: 'Learning path not found',
    });
  }

  await path.deleteOne();

  res.json({
    success: true,
    message: 'Learning path deleted successfully',
  });
});

// @desc    Start learning path
// @route   POST /api/learning-paths/:id/start
// @access  Private
export const start = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  try {
    const progress = await startLearningPath(userId, id);

    res.json({
      success: true,
      message: 'Learning path started successfully',
      progress,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to start learning path',
    });
  }
});

// @desc    Get learning path progress
// @route   GET /api/learning-paths/:id/progress
// @access  Private
export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const progress = await getLearningPathProgress(userId, id);

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Learning path progress not found',
    });
  }

  res.json({
    success: true,
    progress,
  });
});

// @desc    Update learning path progress
// @route   POST /api/learning-paths/:id/update-progress
// @access  Private
export const updateProgress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const progress = await updateLearningPathProgress(userId, id);

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Learning path not found',
    });
  }

  res.json({
    success: true,
    progress,
  });
});

// @desc    Get user's learning paths
// @route   GET /api/learning-paths/user/paths
// @access  Private
export const getUserPaths = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { status, limit = 50, offset = 0 } = req.query;

  const { paths, total } = await getUserLearningPaths(userId, {
    status: status as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: paths.length,
    total,
    paths,
  });
});

// @desc    Pause/resume learning path
// @route   POST /api/learning-paths/:id/toggle-status
// @access  Private
export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const progress = await toggleLearningPathStatus(userId, id);

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Learning path progress not found',
    });
  }

  res.json({
    success: true,
    message: progress.status === 'paused' ? 'Learning path paused' : 'Learning path resumed',
    progress,
  });
});

// @desc    Get next course in learning path
// @route   GET /api/learning-paths/:id/next-course
// @access  Private
export const getNext = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const nextCourse = await getNextCourse(userId, id);

  if (!nextCourse) {
    return res.status(404).json({
      success: false,
      message: 'No next course found or path completed',
    });
  }

  res.json({
    success: true,
    nextCourse,
  });
});

// @desc    Generate AI-powered learning path
// @route   POST /api/learning-paths/generate
// @access  Private
export const generate = asyncHandler(async (req: Request, res: Response) => {
  const { targetSkill, currentLevel, learningStyle, timeCommitment, interests } = req.body;

  if (!targetSkill) {
    return res.status(400).json({
      success: false,
      message: 'Target skill is required',
    });
  }

  try {
    const path = await generateLearningPath({
      targetSkill,
      currentLevel,
      learningStyle,
      timeCommitment,
      interests,
    });

    res.status(201).json({
      success: true,
      message: 'AI learning path generated successfully',
      path,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate learning path',
    });
  }
});

// @desc    Check if user can start learning path
// @route   GET /api/learning-paths/:id/can-start
// @access  Private
export const checkCanStart = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const result = await canStartLearningPath(userId, id);

  res.json({
    success: true,
    ...result,
  });
});


import { Request, Response } from 'express';
import mongoose from 'mongoose';
import LearningGoal from '../models/LearningGoal';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import {
  updateGoalProgress,
  updateAllUserGoals,
  getUserGoalStats,
} from '../services/learningGoalService';

// @desc    Get user's learning goals
// @route   GET /api/learning-goals
// @access  Private
export const getUserGoals = asyncHandler(async (req: Request, res: Response) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const query: any = { user: userId };
  if (status) query.status = status;
  if (type) query.type = type;

  const skip = (Number(page) - 1) * Number(limit);

  const goals = await LearningGoal.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await LearningGoal.countDocuments(query);

  res.json({
    success: true,
    count: goals.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    goals,
  });
});

// @desc    Get single learning goal
// @route   GET /api/learning-goals/:id
// @access  Private
export const getGoal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const goal = await LearningGoal.findOne({
    _id: id,
    user: userId,
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found',
    });
  }

  res.json({
    success: true,
    goal,
  });
});

// @desc    Create learning goal
// @route   POST /api/learning-goals
// @access  Private
export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    type,
    targetValue,
    customCriteria,
    deadline,
    hasDeadline,
    xpReward,
    badgeReward,
    achievementReward,
  } = req.body;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (!title || !type || !targetValue) {
    return res.status(400).json({
      success: false,
      message: 'Title, type, and target value are required',
    });
  }

  const goal = await LearningGoal.create({
    user: userDoc._id,
    title,
    description,
    type,
    targetValue,
    customCriteria,
    deadline: hasDeadline ? deadline : undefined,
    hasDeadline: hasDeadline || false,
    xpReward,
    badgeReward,
    achievementReward,
    status: 'active',
    startedAt: new Date(),
  });

  // Update progress immediately
  await updateGoalProgress(goal._id.toString(), userDoc._id.toString());

  res.status(201).json({
    success: true,
    goal,
  });
});

// @desc    Update learning goal
// @route   PUT /api/learning-goals/:id
// @access  Private
export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const goal = await LearningGoal.findOne({
    _id: id,
    user: userId,
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found',
    });
  }

  // Don't allow updating completed or failed goals
  if (goal.status === 'completed' || goal.status === 'failed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed or failed goals',
    });
  }

  const {
    title,
    description,
    targetValue,
    customCriteria,
    deadline,
    hasDeadline,
    xpReward,
    badgeReward,
    achievementReward,
  } = req.body;

  if (title) goal.title = title;
  if (description !== undefined) goal.description = description;
  if (targetValue) goal.targetValue = targetValue;
  if (customCriteria) goal.customCriteria = customCriteria;
  if (hasDeadline !== undefined) {
    goal.hasDeadline = hasDeadline;
    goal.deadline = hasDeadline ? deadline : undefined;
  }
  if (xpReward !== undefined) goal.xpReward = xpReward;
  if (badgeReward !== undefined) goal.badgeReward = badgeReward;
  if (achievementReward !== undefined) goal.achievementReward = achievementReward;

  await goal.save();

  // Update progress after changes
  await updateGoalProgress(goal._id.toString(), userId.toString());

  res.json({
    success: true,
    goal,
  });
});

// @desc    Delete learning goal
// @route   DELETE /api/learning-goals/:id
// @access  Private
export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const goal = await LearningGoal.findOne({
    _id: id,
    user: userId,
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found',
    });
  }

  await goal.deleteOne();

  res.json({
    success: true,
    message: 'Goal deleted successfully',
  });
});

// @desc    Pause/Resume learning goal
// @route   PUT /api/learning-goals/:id/pause
// @route   PUT /api/learning-goals/:id/resume
// @access  Private
export const pauseGoal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const goal = await LearningGoal.findOne({
    _id: id,
    user: userId,
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found',
    });
  }

  if (goal.status === 'completed' || goal.status === 'failed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot pause/resume completed or failed goals',
    });
  }

  goal.status = goal.status === 'paused' ? 'active' : 'paused';
  await goal.save();

  res.json({
    success: true,
    message: `Goal ${goal.status === 'paused' ? 'paused' : 'resumed'} successfully`,
    goal,
  });
});

// @desc    Manually update goal progress
// @route   POST /api/learning-goals/:id/update-progress
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
  const userId = userDoc._id;

  const goal = await LearningGoal.findOne({
    _id: id,
    user: userId,
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found',
    });
  }

  const updated = await updateGoalProgress(id, userId.toString());

  if (!updated) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update goal progress',
    });
  }

  const updatedGoal = await LearningGoal.findById(id);

  res.json({
    success: true,
    goal: updatedGoal,
  });
});

// @desc    Update all user goals progress
// @route   POST /api/learning-goals/update-all
// @access  Private
export const updateAllGoals = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  await updateAllUserGoals(userId);

  res.json({
    success: true,
    message: 'All goals updated successfully',
  });
});

// @desc    Get user goal statistics
// @route   GET /api/learning-goals/stats
// @access  Private
export const getGoalStats = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const stats = await getUserGoalStats(userId);

  res.json({
    success: true,
    stats,
  });
});


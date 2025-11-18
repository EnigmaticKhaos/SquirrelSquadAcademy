import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { awardXP, XP_AMOUNTS } from '../services/xpService';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, course, category, search } = req.query;

  const query: any = { isPublic: true };
  if (course) query.course = course;
  if (category) query.category = category;
  if (search) {
    query.$text = { $search: search as string };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const projects = await Project.find(query)
    .populate('user', 'username profilePhoto')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Project.countDocuments(query);

  res.json({
    success: true,
    count: projects.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    projects,
  });
});

// @desc    Create project
// @route   POST /api/projects
// @access  Private
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    type,
    githubRepoUrl,
    deployedUrl,
    files,
    codeSnippet,
    language,
    course,
    assignment,
    tags,
    category,
  } = req.body;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (!title || !type) {
    return res.status(400).json({
      success: false,
      message: 'Title and type are required',
    });
  }

  const project = await Project.create({
    user: userDoc._id,
    title,
    description,
    type,
    githubRepoUrl,
    deployedUrl,
    files,
    codeSnippet,
    language,
    course,
    assignment,
    tags: tags || [],
    category,
  });

  // Award XP for sharing project
  await awardXP({
    userId: userDoc._id.toString(),
    amount: XP_AMOUNTS.PROJECT_SHARED,
    source: 'project_shared',
    sourceId: project._id.toString(),
    description: 'Shared a project',
  });

  // Check achievements, badges, goals, and challenges for project sharing
  import('../services/achievementService').then(({ checkAchievementsForTrigger }) => {
    checkAchievementsForTrigger({
      userId: userDoc._id.toString(),
      triggerType: 'project_shared',
      triggerData: { projectId: project._id.toString() },
    }).catch((error) => {
      console.error('Error checking achievements:', error);
    });
  });
  import('../services/badgeService').then(({ checkBadgesForTrigger }) => {
    checkBadgesForTrigger({
      userId: userDoc._id.toString(),
      triggerType: 'project_shared',
      triggerData: { projectId: project._id.toString() },
    }).catch((error) => {
      console.error('Error checking badges:', error);
    });
  });
  import('../services/learningGoalService').then(({ checkGoalsForTrigger }) => {
    checkGoalsForTrigger(userDoc._id.toString(), 'project_shared').catch((error) => {
      console.error('Error checking goals:', error);
    });
  });
  import('../services/challengeService').then(({ checkChallengesForTrigger }) => {
    checkChallengesForTrigger(userDoc._id.toString(), 'project_shared').catch((error) => {
      console.error('Error checking challenges:', error);
    });
  });

  res.status(201).json({
    success: true,
    message: 'Project shared successfully',
    project,
  });
});

// @desc    Like/Unlike project
// @route   POST /api/projects/:id/like
// @access  Private
export const likeProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { emoji = '👍' } = req.body;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  if (project.user.toString() === userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot like your own project',
    });
  }

  const Like = (await import('../models/Like')).default;
  const existingLike = await Like.findOne({
    user: userId,
    targetType: 'project',
    targetId: id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    project.likesCount = Math.max(0, project.likesCount - 1);
    await project.save();

    return res.json({
      success: true,
      message: 'Project unliked',
      liked: false,
    });
  }

  await Like.create({
    user: userId,
    targetType: 'project',
    targetId: id,
    emoji,
  });

  project.likesCount += 1;
  await project.save();

  // Award XP to project owner for receiving a like
  await awardXP({
    userId: project.user.toString(),
    amount: XP_AMOUNTS.LIKE_RECEIVED,
    source: 'like_received',
    sourceId: id,
    description: 'Received a like on project',
  });

  res.json({
    success: true,
    message: 'Project liked',
    liked: true,
  });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .populate('user', 'username profilePhoto')
    .populate('course')
    .populate('assignment');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  res.json({
    success: true,
    project,
  });
});


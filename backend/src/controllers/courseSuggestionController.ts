import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CourseSuggestion from '../models/CourseSuggestion';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import { generateCourse } from '../services/ai/courseGenerationService';

// @desc    Get all course suggestions
// @route   GET /api/course-suggestions
// @access  Public
export const getCourseSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { status, sort = 'voteCount' } = req.query;

  const query: any = {};
  if (status) query.status = status;

  const sortOptions: any = {};
  if (sort === 'voteCount') sortOptions.voteCount = -1;
  else if (sort === 'createdAt') sortOptions.createdAt = -1;

  const suggestions = await CourseSuggestion.find(query)
    .populate('user', 'username email')
    .sort(sortOptions);

  res.json({
    success: true,
    count: suggestions.length,
    suggestions,
  });
});

// @desc    Create course suggestion
// @route   POST /api/course-suggestions
// @access  Private
export const createCourseSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, desiredContent } = req.body;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title and description',
    });
  }

  const suggestion = await CourseSuggestion.create({
    user: userDoc._id,
    title,
    description,
    desiredContent,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Course suggestion submitted successfully',
    suggestion,
  });
});

// @desc    Vote on course suggestion
// @route   POST /api/course-suggestions/:id/vote
// @access  Private
export const voteOnSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const suggestion = await CourseSuggestion.findById(id);

  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }

  // Check if user already voted
  const existingVote = suggestion.votes.find(
    (vote) => vote.user.toString() === userId.toString()
  );

  if (existingVote) {
    // Remove vote
    suggestion.votes = suggestion.votes.filter(
      (vote) => vote.user.toString() !== userId.toString()
    );
    await suggestion.save();
    return res.json({
      success: true,
      message: 'Vote removed',
      suggestion,
    });
  }

  // Add vote
  suggestion.votes.push({
    user: userId,
    createdAt: new Date(),
  });
  await suggestion.save();

  res.json({
    success: true,
    message: 'Vote added',
    suggestion,
  });
});

// @desc    Approve course suggestion (Admin)
// @route   POST /api/course-suggestions/:id/approve
// @access  Private/Admin
export const approveSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const suggestion = await CourseSuggestion.findById(id);

  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }

  if (suggestion.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Suggestion is not pending',
    });
  }

  // Generate course using AI
  try {
    const course = await generateCourse({
      title: suggestion.title,
      description: suggestion.description,
      desiredContent: suggestion.desiredContent || '',
    });

    // Update suggestion
    suggestion.status = 'approved';
    suggestion.reviewedBy = userDoc._id;
    suggestion.reviewedAt = new Date();
    suggestion.generatedCourse = course._id;
    await suggestion.save();

    // TODO: Send notification to user who suggested

    res.json({
      success: true,
      message: 'Course suggestion approved and course generated',
      suggestion,
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating course',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// @desc    Deny course suggestion (Admin)
// @route   POST /api/course-suggestions/:id/deny
// @access  Private/Admin
export const denySuggestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reviewNotes } = req.body;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const suggestion = await CourseSuggestion.findById(id);

  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }

  suggestion.status = 'denied';
  suggestion.reviewedBy = userDoc._id;
  suggestion.reviewedAt = new Date();
  suggestion.reviewNotes = reviewNotes;
  await suggestion.save();

  // TODO: Send notification to user

  res.json({
    success: true,
    message: 'Course suggestion denied',
    suggestion,
  });
});


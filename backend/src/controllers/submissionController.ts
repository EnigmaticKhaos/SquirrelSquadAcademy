import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Submission from '../models/Submission';
import Assignment from '../models/Assignment';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private
export const submitAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;
  const { content, files, githubRepoUrl, githubCommitSha } = req.body;

  const assignment = await Assignment.findById(id).populate('rubric');

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  // Check if user has already submitted
  const existingSubmission = await Submission.findOne({
    assignment: id,
    user: userId,
  });

  if (existingSubmission) {
    // Check retry policy
    if (!assignment.allowRetries) {
      return res.status(400).json({
        success: false,
        message: 'This assignment does not allow retries',
      });
    }

    if (assignment.maxRetries && existingSubmission.attemptNumber >= assignment.maxRetries) {
      return res.status(400).json({
        success: false,
        message: 'Maximum retry limit reached',
      });
    }
  }

  // Create submission
  const submission = await Submission.create({
    assignment: id,
    user: userId,
    course: assignment.course,
    content,
    files,
    githubRepoUrl,
    githubCommitSha,
    maxScore: assignment.totalPoints,
    attemptNumber: existingSubmission ? existingSubmission.attemptNumber + 1 : 1,
    status: 'pending',
  });

  // Trigger AI grading asynchronously
  import('../services/ai/gradingService').then(({ gradeSubmission }) => {
    gradeSubmission(submission._id.toString()).catch((error) => {
      console.error('Error in background grading:', error);
    });
  });

  res.status(201).json({
    success: true,
    message: 'Assignment submitted successfully. Grading in progress...',
    submission,
  });
});

// @desc    Get user submissions
// @route   GET /api/assignments/:id/submissions
// @access  Private
export const getUserSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const submissions = await Submission.find({
    assignment: id,
    user: userId,
  })
    .populate('grade')
    .sort({ submittedAt: -1 });

  res.json({
    success: true,
    count: submissions.length,
    submissions,
  });
});

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
export const getSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const submission = await Submission.findById(id)
    .populate('grade')
    .populate('assignment');

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found',
    });
  }

  // Check if user owns this submission or is admin
  if (submission.user.toString() !== userId.toString() && userDoc.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this submission',
    });
  }

  res.json({
    success: true,
    submission,
  });
});


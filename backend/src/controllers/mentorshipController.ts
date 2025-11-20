import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { IUser } from '../models/User';
import {
  findPotentialMentors,
  sendMentorshipRequest,
  respondToMentorshipRequest,
  addMentorshipSession,
  addMilestone,
  completeMilestone,
  completeMentorship,
  getUserMentorships,
  getMentorshipRequests,
} from '../services/mentorshipService';

// @desc    Find potential mentors
// @route   GET /api/mentorship/find-mentors
// @access  Private
export const findMentors = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { courseId, limit = 10 } = req.query;

  const mentors = await findPotentialMentors(userId, {
    courseId: courseId as string,
    limit: Number(limit),
  });

  res.json({
    success: true,
    count: mentors.length,
    mentors,
  });
});

// @desc    Send mentorship request
// @route   POST /api/mentorship/requests
// @access  Private
export const createMentorshipRequest = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const menteeId = userDoc._id.toString();
  const { mentorId, message, goals, preferredCommunicationMethod, expectedDuration } = req.body;

  if (!mentorId) {
    return res.status(400).json({
      success: false,
      message: 'Mentor ID is required',
    });
  }

  const request = await sendMentorshipRequest(menteeId, mentorId, {
    message,
    goals,
    preferredCommunicationMethod,
    expectedDuration,
  });

  res.status(201).json({
    success: true,
    message: 'Mentorship request sent successfully',
    request,
  });
});

// @desc    Respond to mentorship request
// @route   PUT /api/mentorship/requests/:id/respond
// @access  Private
export const respondToRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const mentorId = userDoc._id.toString();
  const { accept } = req.body;

  if (typeof accept !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'Accept field (boolean) is required',
    });
  }

  const result = await respondToMentorshipRequest(id, mentorId, accept);

  res.json({
    success: true,
    message: accept ? 'Mentorship request accepted' : 'Mentorship request declined',
    result,
  });
});

// @desc    Get mentorship requests
// @route   GET /api/mentorship/requests
// @access  Private
export const getRequests = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { type, status, limit = 50, offset = 0 } = req.query;

  const { requests, total } = await getMentorshipRequests(userId, {
    type: type as any,
    status: status as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: requests.length,
    total,
    requests,
  });
});

// @desc    Get user mentorships
// @route   GET /api/mentorship
// @access  Private
export const getMentorships = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { role, status, limit = 50, offset = 0 } = req.query;

  const { mentorships, total } = await getUserMentorships(userId, {
    role: role as any,
    status: status as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: mentorships.length,
    total,
    mentorships,
  });
});

// @desc    Get single mentorship
// @route   GET /api/mentorship/:id
// @access  Private
export const getMentorship = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const Mentorship = (await import('../models/Mentorship')).default;
  const mentorship = await Mentorship.findById(id)
    .populate('mentee', 'username profilePhoto level xp')
    .populate('mentor', 'username profilePhoto level xp');

  if (!mentorship) {
    return res.status(404).json({
      success: false,
      message: 'Mentorship not found',
    });
  }

  // Check if user is part of this mentorship
  if (mentorship.mentee.toString() !== userId && mentorship.mentor.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this mentorship',
    });
  }

  res.json({
    success: true,
    mentorship,
  });
});

// @desc    Add mentorship session
// @route   POST /api/mentorship/:id/sessions
// @access  Private
export const addSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { date, duration, notes, goalsDiscussed, nextSteps, rating, feedback } = req.body;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Session date is required',
    });
  }

  const mentorship = await addMentorshipSession(id, userId, {
    date: new Date(date),
    duration,
    notes,
    goalsDiscussed,
    nextSteps,
    rating,
    feedback,
  });

  res.status(201).json({
    success: true,
    message: 'Session added successfully',
    mentorship,
  });
});

// @desc    Add milestone
// @route   POST /api/mentorship/:id/milestones
// @access  Private
export const createMilestone = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { title, description, targetDate } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Milestone title is required',
    });
  }

  const mentorship = await addMilestone(id, userId, {
    title,
    description,
    targetDate: targetDate ? new Date(targetDate) : undefined,
  });

  res.status(201).json({
    success: true,
    message: 'Milestone added successfully',
    mentorship,
  });
});

// @desc    Complete milestone
// @route   PUT /api/mentorship/:id/milestones/:milestoneId/complete
// @access  Private
export const completeMilestoneHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id, milestoneId } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { notes } = req.body;

  const mentorship = await completeMilestone(id, milestoneId, userId, notes);

  res.json({
    success: true,
    message: 'Milestone completed successfully',
    mentorship,
  });
});

// @desc    Complete mentorship
// @route   POST /api/mentorship/:id/complete
// @access  Private
export const completeMentorshipHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { rating, feedback } = req.body;

  const mentorship = await completeMentorship(id, userId, {
    rating,
    feedback,
  });

  res.json({
    success: true,
    message: 'Mentorship feedback submitted successfully',
    mentorship,
  });
});


import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Challenge from '../models/Challenge';
import ChallengeParticipant from '../models/ChallengeParticipant';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  joinChallenge,
  updateParticipantProgress,
  checkChallengesForTrigger,
  updateChallengeStatuses,
  getChallengeLeaderboard,
  checkEligibility,
} from '../services/challengeService';

// @desc    Get all challenges
// @route   GET /api/challenges
// @access  Public
export const getChallenges = asyncHandler(async (req: Request, res: Response) => {
  const { status, type, isPublic, page = 1, limit = 20 } = req.query;

  const query: any = {};
  if (status) query.status = status;
  if (type) query.type = type;
  if (isPublic !== undefined) query.isPublic = isPublic === 'true';

  const skip = (Number(page) - 1) * Number(limit);

  // Update challenge statuses before fetching
  await updateChallengeStatuses();

  const challenges = await Challenge.find(query)
    .sort({ startDate: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Challenge.countDocuments(query);

  res.json({
    success: true,
    count: challenges.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    challenges,
  });
});

// @desc    Get single challenge
// @route   GET /api/challenges/:id
// @access  Public
export const getChallenge = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.query;

  // Update challenge status
  await updateChallengeStatuses();

  const challenge = await Challenge.findById(id);

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: 'Challenge not found',
    });
  }

  let participant = null;
  let eligibility = null;

  if (userId) {
    const userIdStr = typeof userId === 'string' ? userId : String(userId);
    // Get user's participation
    participant = await ChallengeParticipant.findOne({
      challenge: id,
      user: userIdStr,
    }).populate('user', 'username profilePhoto');

    // Check eligibility if not participating
    if (!participant) {
      eligibility = await checkEligibility(userIdStr, challenge);
    }
  }

  res.json({
    success: true,
    challenge,
    participant,
    eligibility,
  });
});

// @desc    Create challenge (Admin only)
// @route   POST /api/challenges
// @access  Private/Admin
export const createChallenge = asyncHandler(async (req: Request, res: Response) => {
  const challenge = await Challenge.create(req.body);

  // Update status based on dates
  await updateChallengeStatuses();

  res.status(201).json({
    success: true,
    challenge,
  });
});

// @desc    Update challenge (Admin only)
// @route   PUT /api/challenges/:id
// @access  Private/Admin
export const updateChallenge = asyncHandler(async (req: Request, res: Response) => {
  const challenge = await Challenge.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: 'Challenge not found',
    });
  }

  // Update status based on dates
  await updateChallengeStatuses();

  res.json({
    success: true,
    challenge,
  });
});

// @desc    Delete challenge (Admin only)
// @route   DELETE /api/challenges/:id
// @access  Private/Admin
export const deleteChallenge = asyncHandler(async (req: Request, res: Response) => {
  const challenge = await Challenge.findById(req.params.id);

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: 'Challenge not found',
    });
  }

  await challenge.deleteOne();

  res.json({
    success: true,
    message: 'Challenge deleted successfully',
  });
});

// @desc    Join challenge
// @route   POST /api/challenges/:id/join
// @access  Private
export const joinChallengeRoute = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const result = await joinChallenge(userId, id);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message,
    });
  }

  res.json({
    success: true,
    message: result.message,
  });
});

// @desc    Leave challenge
// @route   DELETE /api/challenges/:id/leave
// @access  Private
export const leaveChallenge = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const participant = await ChallengeParticipant.findOne({
    challenge: id,
    user: userId,
  });

  if (!participant) {
    return res.status(404).json({
      success: false,
      message: 'Not participating in this challenge',
    });
  }

  await participant.deleteOne();

  // Decrement participant count
  const challenge = await Challenge.findById(id);
  if (challenge) {
    challenge.participantCount = Math.max(0, challenge.participantCount - 1);
    await challenge.save();
  }

  res.json({
    success: true,
    message: 'Left challenge successfully',
  });
});

// @desc    Get user's challenges
// @route   GET /api/challenges/user/:userId
// @access  Public
export const getUserChallenges = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.query;

  const query: any = { user: userId };
  if (status) {
    // Filter by challenge status
    const challenges = await Challenge.find({ status }).select('_id');
    query.challenge = { $in: challenges.map(c => c._id) };
  }

  const participants = await ChallengeParticipant.find(query)
    .populate('challenge')
    .sort({ joinedAt: -1 });

  res.json({
    success: true,
    count: participants.length,
    challenges: participants,
  });
});

// @desc    Get challenge leaderboard
// @route   GET /api/challenges/:id/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit = 10 } = req.query;

  const leaderboard = await getChallengeLeaderboard(id, Number(limit));

  res.json({
    success: true,
    count: leaderboard.length,
    leaderboard,
  });
});

// @desc    Get user's challenge progress
// @route   GET /api/challenges/:id/progress
// @access  Private
export const getChallengeProgress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const participant = await ChallengeParticipant.findOne({
    challenge: id,
    user: userId,
  }).populate('challenge');

  if (!participant) {
    return res.status(404).json({
      success: false,
      message: 'Not participating in this challenge',
    });
  }

  res.json({
    success: true,
    participant,
  });
});

// @desc    Manually update challenge progress
// @route   POST /api/challenges/:id/update-progress
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

  const updated = await updateParticipantProgress(id, userId);

  if (!updated) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update challenge progress',
    });
  }

  const participant = await ChallengeParticipant.findOne({
    challenge: id,
    user: userId,
  });

  res.json({
    success: true,
    participant,
  });
});

// @desc    Update all challenge statuses (Admin or cron job)
// @route   POST /api/challenges/update-statuses
// @access  Private/Admin
export const updateStatuses = asyncHandler(async (req: Request, res: Response) => {
  await updateChallengeStatuses();

  res.json({
    success: true,
    message: 'Challenge statuses updated successfully',
  });
});


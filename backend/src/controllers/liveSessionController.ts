import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createLiveSession,
  registerForSession,
  joinSession,
  leaveSession,
  endSession,
  createPoll,
  voteOnPoll,
  askQuestion,
  answerQuestion,
  upvoteQuestion,
  saveRecording,
} from '../services/liveSessionService';
import LiveSession from '../models/LiveSession';
import LiveSessionParticipant from '../models/LiveSessionParticipant';
import LiveSessionPoll from '../models/LiveSessionPoll';
import LiveSessionQandA from '../models/LiveSessionQandA';
import LiveSessionRecording from '../models/LiveSessionRecording';

// @desc    Get all live sessions
// @route   GET /api/live-sessions
// @access  Private
export const getLiveSessions = asyncHandler(async (req: Request, res: Response) => {
  const { status, type, courseId, upcoming, past } = req.query;
  const userId = req.user._id.toString();

  const query: any = {};

  if (status) {
    query.status = status;
  } else if (upcoming === 'true') {
    query.status = { $in: ['scheduled', 'live'] };
    query.scheduledStartTime = { $gte: new Date() };
  } else if (past === 'true') {
    query.status = 'ended';
  }

  if (type) {
    query.sessionType = type;
  }
  if (courseId) {
    query.course = courseId;
  }

  // Show public sessions or user's own sessions
  query.$or = [
    { isPublic: true },
    { host: userId },
    { coHosts: userId },
  ];

  const sessions = await LiveSession.find(query)
    .sort({ scheduledStartTime: 1 })
    .populate('host', 'username profilePhoto')
    .populate('coHosts', 'username profilePhoto')
    .populate('course', 'title')
    .populate('lesson', 'title');

  res.json({
    success: true,
    sessions,
  });
});

// @desc    Get single live session
// @route   GET /api/live-sessions/:id
// @access  Private
export const getLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const session = await LiveSession.findById(id)
    .populate('host', 'username profilePhoto')
    .populate('coHosts', 'username profilePhoto')
    .populate('course', 'title')
    .populate('lesson', 'title')
    .populate('registeredUsers', 'username profilePhoto');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found',
    });
  }

  // Check access
  if (!session.isPublic && session.host.toString() !== userId && !session.coHosts?.some(id => id.toString() === userId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // Get participant info
  const participant = await LiveSessionParticipant.findOne({
    session: id,
    user: userId,
  });

  res.json({
    success: true,
    session,
    participant,
  });
});

// @desc    Create live session
// @route   POST /api/live-sessions
// @access  Private
export const createLiveSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const session = await createLiveSession(userId, req.body);

  res.status(201).json({
    success: true,
    session,
  });
});

// @desc    Update live session
// @route   PUT /api/live-sessions/:id
// @access  Private
export const updateLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const session = await LiveSession.findById(id);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found',
    });
  }

  if (session.host.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Only the host can update the session',
    });
  }

  if (session.status === 'live' || session.status === 'ended') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update session that is live or ended',
    });
  }

  Object.assign(session, req.body);
  await session.save();

  res.json({
    success: true,
    session,
  });
});

// @desc    Register for live session
// @route   POST /api/live-sessions/:id/register
// @access  Private
export const registerForLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const session = await registerForSession(id, userId);

  res.json({
    success: true,
    session,
    message: 'Successfully registered for session',
  });
});

// @desc    Join live session
// @route   POST /api/live-sessions/:id/join
// @access  Private
export const joinLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const { session, participant } = await joinSession(id, userId);

  res.json({
    success: true,
    session,
    participant,
    message: 'Successfully joined session',
  });
});

// @desc    Leave live session
// @route   POST /api/live-sessions/:id/leave
// @access  Private
export const leaveLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  await leaveSession(id, userId);

  res.json({
    success: true,
    message: 'Successfully left session',
  });
});

// @desc    End live session
// @route   POST /api/live-sessions/:id/end
// @access  Private
export const endLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const session = await endSession(id, userId);

  res.json({
    success: true,
    session,
    message: 'Session ended successfully',
  });
});

// @desc    Get session participants
// @route   GET /api/live-sessions/:id/participants
// @access  Private
export const getSessionParticipants = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const participants = await LiveSessionParticipant.find({ session: id })
    .populate('user', 'username profilePhoto')
    .sort({ joinedAt: -1 });

  res.json({
    success: true,
    participants,
  });
});

// @desc    Get session polls
// @route   GET /api/live-sessions/:id/polls
// @access  Private
export const getSessionPolls = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { active } = req.query;

  const query: any = { session: id };
  if (active === 'true') {
    query.isActive = true;
    query.isEnded = false;
  }

  const polls = await LiveSessionPoll.find(query)
    .populate('createdBy', 'username profilePhoto')
    .sort({ startedAt: -1 });

  res.json({
    success: true,
    polls,
  });
});

// @desc    Create poll
// @route   POST /api/live-sessions/:id/polls
// @access  Private
export const createPollHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const poll = await createPoll(id, userId, req.body);

  res.status(201).json({
    success: true,
    poll,
  });
});

// @desc    Vote on poll
// @route   POST /api/live-sessions/polls/:pollId/vote
// @access  Private
export const voteOnPollHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { pollId } = req.params;
  const { selectedOptions } = req.body;

  if (!selectedOptions || !Array.isArray(selectedOptions)) {
    return res.status(400).json({
      success: false,
      message: 'selectedOptions array is required',
    });
  }

  const poll = await voteOnPoll(pollId, userId, selectedOptions);

  res.json({
    success: true,
    poll,
    message: 'Vote recorded successfully',
  });
});

// @desc    Get session Q&A
// @route   GET /api/live-sessions/:id/questions
// @access  Private
export const getSessionQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, answered } = req.query;

  const query: any = { session: id };
  if (status) {
    query.status = status;
  } else if (answered === 'true') {
    query.status = 'answered';
  } else if (answered === 'false') {
    query.status = 'pending';
  }

  const questions = await LiveSessionQandA.find(query)
    .populate('askedBy', 'username profilePhoto')
    .populate('answeredBy', 'username profilePhoto')
    .sort({ isPinned: -1, upvoteCount: -1, askedAt: 1 });

  res.json({
    success: true,
    questions,
  });
});

// @desc    Ask question
// @route   POST /api/live-sessions/:id/questions
// @access  Private
export const askQuestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({
      success: false,
      message: 'Question is required',
    });
  }

  const qa = await askQuestion(id, userId, question);

  res.status(201).json({
    success: true,
    question: qa,
  });
});

// @desc    Answer question
// @route   POST /api/live-sessions/questions/:questionId/answer
// @access  Private
export const answerQuestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { questionId } = req.params;
  const { answer } = req.body;

  if (!answer) {
    return res.status(400).json({
      success: false,
      message: 'Answer is required',
    });
  }

  const qa = await answerQuestion(questionId, userId, answer);

  res.json({
    success: true,
    question: qa,
    message: 'Question answered successfully',
  });
});

// @desc    Upvote question
// @route   POST /api/live-sessions/questions/:questionId/upvote
// @access  Private
export const upvoteQuestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { questionId } = req.params;

  const qa = await upvoteQuestion(questionId, userId);

  res.json({
    success: true,
    question: qa,
  });
});

// @desc    Get session recording
// @route   GET /api/live-sessions/:id/recording
// @access  Private
export const getSessionRecording = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const recording = await LiveSessionRecording.findOne({ session: id });

  if (!recording) {
    return res.status(404).json({
      success: false,
      message: 'Recording not found',
    });
  }

  // Track view
  recording.viewCount += 1;
  recording.lastViewedAt = new Date();
  await recording.save();

  res.json({
    success: true,
    recording,
  });
});

// @desc    Save session recording
// @route   POST /api/live-sessions/:id/recording
// @access  Private
export const saveRecordingHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const session = await LiveSession.findById(id);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found',
    });
  }

  if (session.host.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Only the host can save recordings',
    });
  }

  const recording = await saveRecording(id, req.body);

  res.status(201).json({
    success: true,
    recording,
  });
});


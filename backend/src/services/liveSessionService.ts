import mongoose from 'mongoose';
import LiveSession from '../models/LiveSession';
import LiveSessionParticipant from '../models/LiveSessionParticipant';
import LiveSessionPoll from '../models/LiveSessionPoll';
import LiveSessionQandA from '../models/LiveSessionQandA';
import LiveSessionPollVote from '../models/LiveSessionPollVote';
import LiveSessionRecording from '../models/LiveSessionRecording';
import { createNotification } from './notificationService';
import { sendEmail } from './email/emailService';
import { awardXP } from './xpService';
import { getIO } from '../socket';
import logger from '../utils/logger';

/**
 * Create a live session
 */
export const createLiveSession = async (
  hostId: string,
  data: {
    title: string;
    description?: string;
    sessionType: 'webinar' | 'workshop' | 'qna' | 'office_hours' | 'course_completion_party' | 'custom';
    scheduledStartTime: Date;
    scheduledEndTime?: Date;
    provider?: 'webrtc' | 'zoom' | 'custom';
    meetingUrl?: string;
    meetingId?: string;
    meetingPassword?: string;
    courseId?: string;
    lessonId?: string;
    maxParticipants?: number;
    allowRecording?: boolean;
    requireRegistration?: boolean;
    isPublic?: boolean;
    allowQuestions?: boolean;
    allowPolls?: boolean;
    allowScreenShare?: boolean;
    allowChat?: boolean;
    registrationDeadline?: Date;
    coHosts?: string[];
  }
): Promise<any> => {
  try {
    const session = await LiveSession.create({
      host: hostId,
      coHosts: data.coHosts,
      title: data.title,
      description: data.description,
      sessionType: data.sessionType,
      scheduledStartTime: data.scheduledStartTime,
      scheduledEndTime: data.scheduledEndTime,
      provider: data.provider || 'webrtc',
      meetingUrl: data.meetingUrl,
      meetingId: data.meetingId,
      meetingPassword: data.meetingPassword,
      course: data.courseId,
      lesson: data.lessonId,
      maxParticipants: data.maxParticipants,
      allowRecording: data.allowRecording !== undefined ? data.allowRecording : true,
      requireRegistration: data.requireRegistration || false,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      allowQuestions: data.allowQuestions !== undefined ? data.allowQuestions : true,
      allowPolls: data.allowPolls !== undefined ? data.allowPolls : true,
      allowScreenShare: data.allowScreenShare !== undefined ? data.allowScreenShare : true,
      allowChat: data.allowChat !== undefined ? data.allowChat : true,
      registrationDeadline: data.registrationDeadline,
    });

    // Create participant record for host
    await LiveSessionParticipant.create({
      session: session._id,
      user: hostId,
      role: 'host',
      status: 'registered',
      registeredAt: new Date(),
    });

    // Create participant records for co-hosts
    if (data.coHosts && data.coHosts.length > 0) {
      for (const coHostId of data.coHosts) {
        await LiveSessionParticipant.create({
          session: session._id,
          user: coHostId,
          role: 'co_host',
          status: 'registered',
          registeredAt: new Date(),
        });
      }
    }

    logger.info(`Live session created: ${session._id} by host ${hostId}`);
    return session;
  } catch (error) {
    logger.error('Error creating live session:', error);
    throw error;
  }
};

/**
 * Register for a live session
 */
export const registerForSession = async (
  sessionId: string,
  userId: string
): Promise<any> => {
  try {
    const session = await LiveSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === 'ended' || session.status === 'cancelled') {
      throw new Error('Session is no longer available');
    }

    // Check if registration deadline has passed
    if (session.registrationDeadline && session.registrationDeadline < new Date()) {
      throw new Error('Registration deadline has passed');
    }

    // Check if max participants reached
    if (session.maxParticipants && session.registeredUsers.length >= session.maxParticipants) {
      throw new Error('Session is full');
    }

    // Check if already registered
    if (session.registeredUsers.includes(userId as any)) {
      throw new Error('Already registered for this session');
    }

    // Add user to registered users
    session.registeredUsers.push(userId as any);
    await session.save();

    // Create participant record
    await LiveSessionParticipant.create({
      session: sessionId,
      user: userId,
      role: 'participant',
      status: 'registered',
      registeredAt: new Date(),
    });

    // Send confirmation notification
    await createNotification(userId, 'live_session_registered', {
      title: 'Registered for Live Session',
      message: `You've successfully registered for "${session.title}"`,
      actionUrl: `/live-sessions/${sessionId}`,
      relatedCourse: session.course?.toString(),
      sendEmail: true,
    }).catch((error) => {
      logger.error('Error sending registration notification:', error);
    });

    logger.info(`User ${userId} registered for session ${sessionId}`);
    return session;
  } catch (error) {
    logger.error('Error registering for session:', error);
    throw error;
  }
};

/**
 * Join a live session
 */
export const joinSession = async (
  sessionId: string,
  userId: string
): Promise<any> => {
  try {
    const session = await LiveSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === 'ended' || session.status === 'cancelled') {
      throw new Error('Session is no longer available');
    }

    // Check if registration required
    if (session.requireRegistration && !session.registeredUsers.includes(userId as any)) {
      throw new Error('Registration required to join this session');
    }

    // Update or create participant record
    let participant = await LiveSessionParticipant.findOne({
      session: sessionId,
      user: userId,
    });

    if (!participant) {
      participant = await LiveSessionParticipant.create({
        session: sessionId,
        user: userId,
        role: 'participant',
        status: 'joined',
        registeredAt: new Date(),
        joinedAt: new Date(),
      });
    } else {
      participant.status = 'joined';
      participant.joinedAt = new Date();
      await participant.save();
    }

    // Update session statistics
    session.totalParticipants += 1;
    const currentParticipants = await LiveSessionParticipant.countDocuments({
      session: sessionId,
      status: 'joined',
    });
    if (currentParticipants > session.peakParticipants) {
      session.peakParticipants = currentParticipants;
    }

    // Start session if it's the first participant and host
    if (session.status === 'scheduled' && (session.host.toString() === userId || session.coHosts?.some(id => id.toString() === userId))) {
      session.status = 'live';
      session.actualStartTime = new Date();
    }

    await session.save();

    logger.info(`User ${userId} joined session ${sessionId}`);
    return { session, participant };
  } catch (error) {
    logger.error('Error joining session:', error);
    throw error;
  }
};

/**
 * Leave a live session
 */
export const leaveSession = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  try {
    const participant = await LiveSessionParticipant.findOne({
      session: sessionId,
      user: userId,
      status: 'joined',
    });

    if (!participant) {
      return;
    }

    const now = new Date();
    const joinedAt = participant.joinedAt || now;
    const duration = Math.floor((now.getTime() - joinedAt.getTime()) / 1000);

    participant.status = 'left';
    participant.leftAt = now;
    participant.duration += duration;
    participant.watchTime += duration;
    await participant.save();

    // Update session statistics
    const session = await LiveSession.findById(sessionId);
    if (session) {
      session.totalViews += 1;
      await session.save();
    }

    logger.info(`User ${userId} left session ${sessionId}`);
  } catch (error) {
    logger.error('Error leaving session:', error);
    throw error;
  }
};

/**
 * End a live session
 */
export const endSession = async (
  sessionId: string,
  hostId: string
): Promise<any> => {
  try {
    const session = await LiveSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.host.toString() !== hostId) {
      throw new Error('Only the host can end the session');
    }

    const now = new Date();
    session.status = 'ended';
    session.actualEndTime = now;

    if (session.actualStartTime) {
      session.duration = Math.floor((now.getTime() - session.actualStartTime.getTime()) / 60000); // in minutes
    }

    await session.save();

    // Update all participants to 'left' status
    await LiveSessionParticipant.updateMany(
      { session: sessionId, status: 'joined' },
      {
        $set: {
          status: 'left',
          leftAt: now,
        },
      }
    );

    // Award XP to participants
    const participants = await LiveSessionParticipant.find({
      session: sessionId,
      status: { $in: ['joined', 'left'] },
    });

    for (const participant of participants) {
      if (participant.user.toString() !== hostId) {
        await awardXP({
          userId: participant.user.toString(),
          amount: 25,
          source: 'live_session_attended',
          sourceId: sessionId,
          description: 'Attended a live session',
        }).catch((error) => {
          logger.error('Error awarding XP:', error);
        });
      }
    }

    logger.info(`Session ${sessionId} ended by host ${hostId}`);
    return session;
  } catch (error) {
    logger.error('Error ending session:', error);
    throw error;
  }
};

/**
 * Create a poll in a live session
 */
export const createPoll = async (
  sessionId: string,
  userId: string,
  data: {
    question: string;
    options: string[];
    isMultipleChoice?: boolean;
    isAnonymous?: boolean;
    duration?: number;
  }
): Promise<any> => {
  try {
    const session = await LiveSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Check if user is host or co-host
    const isHost = session.host.toString() === userId;
    const isCoHost = session.coHosts?.some(id => id.toString() === userId);

    if (!isHost && !isCoHost) {
      throw new Error('Only hosts can create polls');
    }

    if (!session.allowPolls) {
      throw new Error('Polls are not enabled for this session');
    }

    const poll = await LiveSessionPoll.create({
      session: sessionId,
      createdBy: userId,
      question: data.question,
      options: data.options,
      isMultipleChoice: data.isMultipleChoice || false,
      isAnonymous: data.isAnonymous || false,
      startedAt: new Date(),
      duration: data.duration,
      results: data.options.map(option => ({
        option,
        votes: 0,
        percentage: 0,
      })),
    });

    // Set end time if duration is specified
    if (data.duration) {
      const endTime = new Date();
      endTime.setSeconds(endTime.getSeconds() + data.duration);
      poll.endedAt = endTime;
      await poll.save();
    }

    // Emit real-time poll creation
    try {
      const io = getIO();
      io.to(`live_session:${sessionId}`).emit('poll_created', {
        poll: await poll.populate('createdBy', 'username profilePhoto'),
      });
    } catch (error) {
      logger.warn('Could not emit poll creation:', error);
    }

    logger.info(`Poll created: ${poll._id} in session ${sessionId}`);
    return poll;
  } catch (error) {
    logger.error('Error creating poll:', error);
    throw error;
  }
};

/**
 * Vote on a poll
 */
export const voteOnPoll = async (
  pollId: string,
  userId: string,
  selectedOptions: number[]
): Promise<any> => {
  try {
    const poll = await LiveSessionPoll.findById(pollId);

    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.isEnded) {
      throw new Error('Poll has ended');
    }

    // Check if already voted
    const existingVote = await LiveSessionPollVote.findOne({
      poll: pollId,
      user: userId,
    });

    if (existingVote) {
      throw new Error('Already voted on this poll');
    }

    // Validate selected options
    if (!poll.isMultipleChoice && selectedOptions.length > 1) {
      throw new Error('Only one option can be selected');
    }

    if (selectedOptions.some(opt => opt < 0 || opt >= poll.options.length)) {
      throw new Error('Invalid option selected');
    }

    // Create vote
    await LiveSessionPollVote.create({
      poll: pollId,
      session: poll.session,
      user: userId,
      selectedOptions,
    });

    // Update poll results
    poll.totalVotes += 1;
    for (const optionIndex of selectedOptions) {
      poll.results[optionIndex].votes += 1;
    }

    // Calculate percentages
    poll.results.forEach(result => {
      result.percentage = poll.totalVotes > 0
        ? Math.round((result.votes / poll.totalVotes) * 100)
        : 0;
    });

    await poll.save();

    // Update participant stats
    await LiveSessionParticipant.findOneAndUpdate(
      { session: poll.session, user: userId },
      { $inc: { pollsAnswered: 1 } }
    );

    // Emit real-time poll update
    try {
      const io = getIO();
      io.to(`live_session:${poll.session}`).emit('poll_updated', {
        pollId: poll._id,
        poll: await poll.populate('createdBy', 'username profilePhoto'),
      });
    } catch (error) {
      logger.warn('Could not emit poll update:', error);
    }

    logger.info(`User ${userId} voted on poll ${pollId}`);
    return poll;
  } catch (error) {
    logger.error('Error voting on poll:', error);
    throw error;
  }
};

/**
 * Ask a question in a live session
 */
export const askQuestion = async (
  sessionId: string,
  userId: string,
  question: string
): Promise<any> => {
  try {
    const session = await LiveSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.allowQuestions) {
      throw new Error('Q&A is not enabled for this session');
    }

    const qa = await LiveSessionQandA.create({
      session: sessionId,
      askedBy: userId,
      question,
      status: 'pending',
    });

    // Update participant stats
    await LiveSessionParticipant.findOneAndUpdate(
      { session: sessionId, user: userId },
      { $inc: { questionsAsked: 1 } }
    );

    // Emit real-time question update
    try {
      const io = getIO();
      io.to(`live_session:${sessionId}`).emit('question_asked', {
        question: await qa.populate('askedBy', 'username profilePhoto'),
      });
    } catch (error) {
      logger.warn('Could not emit question update:', error);
    }

    logger.info(`Question asked: ${qa._id} in session ${sessionId}`);
    return qa;
  } catch (error) {
    logger.error('Error asking question:', error);
    throw error;
  }
};

/**
 * Answer a question
 */
export const answerQuestion = async (
  questionId: string,
  userId: string,
  answer: string
): Promise<any> => {
  try {
    const qa = await LiveSessionQandA.findById(questionId).populate('session');

    if (!qa) {
      throw new Error('Question not found');
    }

    const session = qa.session as any;

    // Check if user is host or co-host
    const isHost = session.host.toString() === userId;
    const isCoHost = session.coHosts?.some((id: any) => id.toString() === userId);

    if (!isHost && !isCoHost) {
      throw new Error('Only hosts can answer questions');
    }

    qa.answer = answer;
    qa.answeredBy = new mongoose.Types.ObjectId(userId);
    qa.answeredAt = new Date();
    qa.status = 'answered';
    await qa.save();

    // Send notification to question asker
    await createNotification(qa.askedBy.toString(), 'question_answered', {
      title: 'Your Question Was Answered',
      message: `Your question in "${session.title}" has been answered`,
      actionUrl: `/live-sessions/${session._id}`,
      relatedCourse: session.course?.toString(),
      sendEmail: true,
    }).catch((error) => {
      logger.error('Error sending answer notification:', error);
    });

    // Emit real-time answer update
    try {
      const io = getIO();
      await qa.populate('askedBy', 'username profilePhoto');
      await qa.populate('answeredBy', 'username profilePhoto');
      io.to(`live_session:${session._id}`).emit('question_answered', {
        question: qa,
      });
    } catch (error) {
      logger.warn('Could not emit answer update:', error);
    }

    logger.info(`Question ${questionId} answered by ${userId}`);
    return qa;
  } catch (error) {
    logger.error('Error answering question:', error);
    throw error;
  }
};

/**
 * Upvote a question
 */
export const upvoteQuestion = async (
  questionId: string,
  userId: string
): Promise<any> => {
  try {
    const qa = await LiveSessionQandA.findById(questionId);

    if (!qa) {
      throw new Error('Question not found');
    }

    // Check if already upvoted
    if (qa.upvotes.includes(userId as any)) {
      // Remove upvote
      qa.upvotes = qa.upvotes.filter(id => id.toString() !== userId);
      qa.upvoteCount = Math.max(0, qa.upvoteCount - 1);
    } else {
      // Add upvote
      qa.upvotes.push(userId as any);
      qa.upvoteCount += 1;
    }

    await qa.save();
    return qa;
  } catch (error) {
    logger.error('Error upvoting question:', error);
    throw error;
  }
};

/**
 * Save session recording
 */
export const saveRecording = async (
  sessionId: string,
  recordingData: {
    recordingUrl: string;
    thumbnailUrl?: string;
    duration: number;
    format?: string;
    resolution?: string;
    fileSize?: number;
  }
): Promise<any> => {
  try {
    const session = await LiveSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    const recording = await LiveSessionRecording.create({
      session: sessionId,
      recordingUrl: recordingData.recordingUrl,
      thumbnailUrl: recordingData.thumbnailUrl,
      duration: recordingData.duration,
      format: recordingData.format || 'mp4',
      resolution: recordingData.resolution,
      fileSize: recordingData.fileSize,
      processingStatus: 'completed',
    });

    // Update session
    session.recordingUrl = recordingData.recordingUrl;
    session.recordingAvailable = true;
    await session.save();

    logger.info(`Recording saved for session ${sessionId}`);
    return recording;
  } catch (error) {
    logger.error('Error saving recording:', error);
    throw error;
  }
};

/**
 * Send session reminders
 */
export const sendSessionReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find sessions starting in 1 hour (if not sent) or 1 day (if not sent)
    const sessionsToRemind = await LiveSession.find({
      status: 'scheduled',
      remindersSent: false,
      scheduledStartTime: {
        $gte: now,
        $lte: oneDayFromNow,
      },
    }).populate('host', 'email username').populate('registeredUsers', 'email username');

    for (const session of sessionsToRemind) {
      const timeUntilStart = session.scheduledStartTime.getTime() - now.getTime();
      const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);

      // Send 1-day reminder
      if (hoursUntilStart <= 24 && hoursUntilStart > 1) {
        for (const user of session.registeredUsers as any[]) {
          await createNotification(user._id.toString(), 'live_session_reminder', {
            title: 'Live Session Reminder',
            message: `"${session.title}" starts in ${Math.round(hoursUntilStart)} hours`,
            actionUrl: `/live-sessions/${session._id}`,
            relatedCourse: session.course?.toString(),
            sendEmail: true,
          }).catch((error) => {
            logger.error('Error sending reminder notification:', error);
          });
        }
      }

      // Send 1-hour reminder
      if (hoursUntilStart <= 1 && hoursUntilStart > 0) {
        for (const user of session.registeredUsers as any[]) {
          await createNotification(user._id.toString(), 'live_session_reminder', {
            title: 'Live Session Starting Soon',
            message: `"${session.title}" starts in ${Math.round(hoursUntilStart * 60)} minutes`,
            actionUrl: `/live-sessions/${session._id}`,
            relatedCourse: session.course?.toString(),
            sendEmail: true,
          }).catch((error) => {
            logger.error('Error sending reminder notification:', error);
          });
        }
        session.remindersSent = true;
        await session.save();
      }
    }

    logger.info(`Processed reminders for ${sessionsToRemind.length} sessions`);
  } catch (error) {
    logger.error('Error sending session reminders:', error);
  }
};


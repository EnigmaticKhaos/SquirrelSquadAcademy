import PomodoroSession from '../models/PomodoroSession';
import { awardXP } from './xpService';
import { startLearningSession, endLearningSession } from './learningAnalyticsService';
import logger from '../utils/logger';

/**
 * Start a Pomodoro session
 */
export const startPomodoroSession = async (
  userId: string,
  data: {
    workDuration?: number;
    shortBreakDuration?: number;
    longBreakDuration?: number;
    longBreakInterval?: number;
    courseId?: string;
    lessonId?: string;
    activityType?: string;
  }
): Promise<any> => {
  try {
    // Check for active session
    const activeSession = await PomodoroSession.findOne({
      user: userId,
      isCompleted: false,
    });

    if (activeSession) {
      throw new Error('You already have an active Pomodoro session');
    }

    const session = await PomodoroSession.create({
      user: userId,
      workDuration: data.workDuration || 25,
      shortBreakDuration: data.shortBreakDuration || 5,
      longBreakDuration: data.longBreakDuration || 15,
      longBreakInterval: data.longBreakInterval || 4,
      sessionType: 'work',
      currentPomodoro: 1,
      startTime: new Date(),
      course: data.courseId,
      lesson: data.lessonId,
      activityType: data.activityType,
    });

    // Start learning session if course/lesson is provided
    if (data.courseId) {
      await startLearningSession(userId, {
        courseId: data.courseId,
        lessonId: data.lessonId,
        activityType: 'practice',
      }).catch((error) => {
        logger.warn('Could not start learning session:', error);
      });
    }

    logger.info(`Pomodoro session started: ${session._id} for user ${userId}`);
    return session;
  } catch (error) {
    logger.error('Error starting Pomodoro session:', error);
    throw error;
  }
};

/**
 * Pause a Pomodoro session
 */
export const pausePomodoroSession = async (
  sessionId: string,
  userId: string
): Promise<any> => {
  try {
    const session = await PomodoroSession.findOne({
      _id: sessionId,
      user: userId,
      isCompleted: false,
    });

    if (!session) {
      throw new Error('Session not found or already completed');
    }

    if (session.isPaused) {
      throw new Error('Session is already paused');
    }

    session.isPaused = true;
    session.pausedAt = new Date();
    await session.save();

    return session;
  } catch (error) {
    logger.error('Error pausing Pomodoro session:', error);
    throw error;
  }
};

/**
 * Resume a Pomodoro session
 */
export const resumePomodoroSession = async (
  sessionId: string,
  userId: string
): Promise<any> => {
  try {
    const session = await PomodoroSession.findOne({
      _id: sessionId,
      user: userId,
      isCompleted: false,
      isPaused: true,
    });

    if (!session) {
      throw new Error('Session not found or not paused');
    }

    // Calculate paused time
    if (session.pausedAt) {
      const pausedDuration = Math.floor((new Date().getTime() - session.pausedAt.getTime()) / 1000);
      session.totalPausedTime += pausedDuration;
    }

    session.isPaused = false;
    session.pausedAt = undefined;
    await session.save();

    return session;
  } catch (error) {
    logger.error('Error resuming Pomodoro session:', error);
    throw error;
  }
};

/**
 * Complete a Pomodoro session (work, break, etc.)
 */
export const completePomodoroSession = async (
  sessionId: string,
  userId: string
): Promise<any> => {
  try {
    const session = await PomodoroSession.findOne({
      _id: sessionId,
      user: userId,
      isCompleted: false,
    });

    if (!session) {
      throw new Error('Session not found or already completed');
    }

    const now = new Date();
    const startTime = session.pausedAt || session.startTime;
    const actualDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000) - session.totalPausedTime;

    session.duration = actualDuration;
    session.endTime = now;

    if (session.sessionType === 'work') {
      session.completedPomodoros += 1;
      session.totalWorkTime += actualDuration;

      // Award XP for completing a Pomodoro
      await awardXP({
        userId,
        amount: 10,
        source: 'pomodoro_completed',
        sourceId: sessionId,
        description: 'Completed a Pomodoro work session',
      }).catch((error) => {
        logger.error('Error awarding XP for Pomodoro:', error);
      });

      // Determine next session type
      if (session.completedPomodoros % session.longBreakInterval === 0) {
        session.sessionType = 'long_break';
        session.startTime = now;
        session.endTime = undefined;
        session.duration = 0;
        session.totalPausedTime = 0;
      } else {
        session.sessionType = 'short_break';
        session.startTime = now;
        session.endTime = undefined;
        session.duration = 0;
        session.totalPausedTime = 0;
      }
    } else {
      // Break completed, start next work session
      session.currentPomodoro += 1;
      session.sessionType = 'work';
      session.startTime = now;
      session.endTime = undefined;
      session.duration = 0;
      session.totalPausedTime = 0;
    }

    await session.save();

    return session;
  } catch (error) {
    logger.error('Error completing Pomodoro session:', error);
    throw error;
  }
};

/**
 * End Pomodoro session completely
 */
export const endPomodoroSession = async (
  sessionId: string,
  userId: string
): Promise<any> => {
  try {
    const session = await PomodoroSession.findOne({
      _id: sessionId,
      user: userId,
      isCompleted: false,
    });

    if (!session) {
      throw new Error('Session not found or already completed');
    }

    const now = new Date();
    const startTime = session.pausedAt || session.startTime;
    const actualDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000) - session.totalPausedTime;

    session.duration = actualDuration;
    session.endTime = now;
    session.isCompleted = true;

    if (session.sessionType === 'work') {
      session.totalWorkTime += actualDuration;
    }

    await session.save();

    // End learning session if it exists
    if (session.course) {
      // Find and end the learning session
      const { default: LearningSession } = await import('../models/LearningSession');
      const learningSession = await LearningSession.findOne({
        user: userId,
        course: session.course,
        endTime: undefined,
      });

      if (learningSession) {
        await endLearningSession(learningSession._id.toString(), userId).catch((error) => {
          logger.warn('Could not end learning session:', error);
        });
      }
    }

    logger.info(`Pomodoro session ended: ${sessionId}`);
    return session;
  } catch (error) {
    logger.error('Error ending Pomodoro session:', error);
    throw error;
  }
};

/**
 * Get active Pomodoro session
 */
export const getActiveSession = async (userId: string): Promise<any | null> => {
  try {
    const session = await PomodoroSession.findOne({
      user: userId,
      isCompleted: false,
    })
      .populate('course', 'title')
      .populate('lesson', 'title');

    return session;
  } catch (error) {
    logger.error('Error getting active session:', error);
    throw error;
  }
};

/**
 * Get Pomodoro session history
 */
export const getSessionHistory = async (
  userId: string,
  limit: number = 20
): Promise<any[]> => {
  try {
    const sessions = await PomodoroSession.find({
      user: userId,
      isCompleted: true,
    })
      .sort({ endTime: -1 })
      .limit(limit)
      .populate('course', 'title')
      .populate('lesson', 'title');

    return sessions;
  } catch (error) {
    logger.error('Error getting session history:', error);
    throw error;
  }
};

/**
 * Get Pomodoro statistics
 */
export const getPomodoroStatistics = async (userId: string): Promise<{
  totalSessions: number;
  totalPomodoros: number;
  totalWorkTime: number; // in seconds
  averageSessionDuration: number; // in seconds
  longestSession: number; // in seconds
  currentStreak: number; // days
}> => {
  try {
    const sessions = await PomodoroSession.find({
      user: userId,
      isCompleted: true,
    });

    const totalSessions = sessions.length;
    const totalPomodoros = sessions.reduce((sum, s) => sum + s.completedPomodoros, 0);
    const totalWorkTime = sessions.reduce((sum, s) => sum + s.totalWorkTime, 0);
    const averageSessionDuration = totalSessions > 0
      ? sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions
      : 0;
    const longestSession = sessions.length > 0
      ? Math.max(...sessions.map(s => s.duration))
      : 0;

    // Calculate current streak (consecutive days with at least one completed session)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      const hasSession = sessions.some(s => {
        if (!s.endTime) return false;
        const sessionDate = new Date(s.endTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime();
      });

      if (hasSession) {
        currentStreak++;
      } else if (i > 0) {
        // Break streak if not today
        break;
      }
    }

    return {
      totalSessions,
      totalPomodoros,
      totalWorkTime,
      averageSessionDuration: Math.round(averageSessionDuration),
      longestSession,
      currentStreak,
    };
  } catch (error) {
    logger.error('Error getting Pomodoro statistics:', error);
    throw error;
  }
};


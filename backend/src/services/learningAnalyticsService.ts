import LearningSession, { ILearningSession } from '../models/LearningSession';
import LearningStreak, { StreakType } from '../models/LearningStreak';
import CourseEnrollment from '../models/CourseEnrollment';
import CourseCompletion from '../models/CourseCompletion';
import Submission from '../models/Submission';
import User from '../models/User';
import Course from '../models/Course';
import logger from '../utils/logger';

/**
 * Start a learning session
 */
export const startLearningSession = async (
  userId: string,
  data: {
    courseId?: string;
    lessonId?: string;
    moduleId?: string;
    activityType: 'lesson' | 'quiz' | 'assignment' | 'video' | 'reading' | 'practice';
  }
): Promise<ILearningSession> => {
  try {
    // Get current progress
    let progressBefore = 0;
    if (data.courseId) {
      const enrollment = await CourseEnrollment.findOne({
        user: userId,
        course: data.courseId,
      });
      progressBefore = enrollment?.progressPercentage || 0;
    }

    // Create session
    const session = await LearningSession.create({
      user: userId,
      course: data.courseId,
      lesson: data.lessonId,
      module: data.moduleId,
      activityType: data.activityType,
      startTime: new Date(),
      progressBefore,
    });

    // Update activity streak
    await updateActivityStreak(userId);

    logger.info(`Learning session started: ${session._id} for user ${userId}`);
    return session;
  } catch (error) {
    logger.error('Error starting learning session:', error);
    throw error;
  }
};

/**
 * End a learning session
 */
export const endLearningSession = async (
  sessionId: string,
  userId: string
): Promise<ILearningSession | null> => {
  try {
    const session = await LearningSession.findOne({
      _id: sessionId,
      user: userId,
      endTime: { $exists: false },
    });

    if (!session) {
      return null;
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

    // Get updated progress
    let progressAfter = session.progressBefore;
    if (session.course) {
      const enrollment = await CourseEnrollment.findOne({
        user: userId,
        course: session.course,
      });
      progressAfter = enrollment?.progressPercentage || progressAfter;
    }

    session.endTime = endTime;
    session.duration = duration;
    session.progressAfter = progressAfter;
    await session.save();

    logger.info(`Learning session ended: ${sessionId}, duration: ${duration}s`);
    return session;
  } catch (error) {
    logger.error('Error ending learning session:', error);
    return null;
  }
};

/**
 * Update activity streak
 */
export const updateActivityStreak = async (userId: string): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await LearningStreak.findOne({
      user: userId,
      type: 'activity',
    });

    if (!streak) {
      streak = await LearningStreak.create({
        user: userId,
        type: 'activity',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      });
      return;
    }

    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no update needed
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      streak.currentStreak += 1;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    } else {
      // Streak broken
      streak.currentStreak = 1;
    }

    streak.lastActivityDate = today;
    await streak.save();
  } catch (error) {
    logger.error('Error updating activity streak:', error);
  }
};

/**
 * Update login streak
 */
export const updateLoginStreak = async (userId: string): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await LearningStreak.findOne({
      user: userId,
      type: 'login',
    });

    if (!streak) {
      streak = await LearningStreak.create({
        user: userId,
        type: 'login',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      });
      return;
    }

    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      return;
    } else if (daysDiff === 1) {
      streak.currentStreak += 1;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    } else {
      streak.currentStreak = 1;
    }

    streak.lastActivityDate = today;
    await streak.save();
  } catch (error) {
    logger.error('Error updating login streak:', error);
  }
};

/**
 * Get user learning analytics
 */
export const getUserLearningAnalytics = async (
  userId: string,
  options?: {
    courseId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  totalTimeSpent: number; // in seconds
  totalSessions: number;
  averageSessionDuration: number; // in seconds
  coursesCompleted: number;
  coursesInProgress: number;
  assignmentsCompleted: number;
  averageScore: number;
  currentStreaks: {
    login: number;
    activity: number;
  };
  longestStreaks: {
    login: number;
    activity: number;
  };
  timeByActivity: {
    [key: string]: number;
  };
  timeByCourse: Array<{
    courseId: string;
    courseName: string;
    timeSpent: number;
  }>;
  weeklyActivity: Array<{
    date: string;
    timeSpent: number;
    sessions: number;
  }>;
  monthlyActivity: Array<{
    month: string;
    timeSpent: number;
    sessions: number;
  }>;
}> => {
  try {
    const query: any = { user: userId };

    if (options?.courseId) {
      query.course = options.courseId;
    }

    if (options?.startDate || options?.endDate) {
      query.startTime = {};
      if (options.startDate) {
        query.startTime.$gte = options.startDate;
      }
      if (options.endDate) {
        query.startTime.$lte = options.endDate;
      }
    }

    // Get all sessions
    const sessions = await LearningSession.find(query);

    // Calculate total time
    const totalTimeSpent = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalSessions = sessions.length;
    const averageSessionDuration = totalSessions > 0 ? totalTimeSpent / totalSessions : 0;

    // Get course statistics
    const enrollments = await CourseEnrollment.find({ user: userId });
    const coursesCompleted = await CourseCompletion.countDocuments({ user: userId });
    const coursesInProgress = enrollments.filter(e => e.status === 'enrolled').length;

    // Get assignment statistics
    const submissions = await Submission.find({
      user: userId,
      status: 'graded',
    });
    const assignmentsCompleted = submissions.length;
    const averageScore = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
      : 0;

    // Get streaks
    const loginStreak = await LearningStreak.findOne({ user: userId, type: 'login' });
    const activityStreak = await LearningStreak.findOne({ user: userId, type: 'activity' });

    // Time by activity type
    const timeByActivity: { [key: string]: number } = {};
    sessions.forEach(session => {
      const type = session.activityType;
      timeByActivity[type] = (timeByActivity[type] || 0) + (session.duration || 0);
    });

    // Time by course
    const timeByCourseMap = new Map<string, { courseId: string; courseName: string; timeSpent: number }>();
    sessions.forEach(session => {
      if (session.course) {
        const courseId = session.course.toString();
        const existing = timeByCourseMap.get(courseId) || { courseId, courseName: 'Unknown', timeSpent: 0 };
        existing.timeSpent += session.duration || 0;
        timeByCourseMap.set(courseId, existing);
      }
    });

    // Populate course names
    const courseIds = Array.from(timeByCourseMap.keys());
    const courses = await Course.find({ _id: { $in: courseIds } }).select('_id title');
    courses.forEach(course => {
      const entry = timeByCourseMap.get(course._id.toString());
      if (entry) {
        entry.courseName = course.title;
      }
    });

    const timeByCourse = Array.from(timeByCourseMap.values());

    // Weekly activity (last 8 weeks)
    const weeklyActivity = calculateWeeklyActivity(sessions);

    // Monthly activity (last 12 months)
    const monthlyActivity = calculateMonthlyActivity(sessions);

    return {
      totalTimeSpent,
      totalSessions,
      averageSessionDuration,
      coursesCompleted,
      coursesInProgress,
      assignmentsCompleted,
      averageScore,
      currentStreaks: {
        login: loginStreak?.currentStreak || 0,
        activity: activityStreak?.currentStreak || 0,
      },
      longestStreaks: {
        login: loginStreak?.longestStreak || 0,
        activity: activityStreak?.longestStreak || 0,
      },
      timeByActivity,
      timeByCourse,
      weeklyActivity,
      monthlyActivity,
    };
  } catch (error) {
    logger.error('Error getting user learning analytics:', error);
    throw error;
  }
};

/**
 * Get course-specific analytics
 */
export const getCourseAnalytics = async (
  userId: string,
  courseId: string
): Promise<{
  timeSpent: number;
  sessions: number;
  progress: number;
  assignmentsCompleted: number;
  averageScore: number;
  lastActivity: Date | null;
  streak: number;
  completionDate?: Date;
}> => {
  try {
    const sessions = await LearningSession.find({
      user: userId,
      course: courseId,
    });

    const timeSpent = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const sessionsCount = sessions.length;
    const lastSession = sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    const submissions = await Submission.find({
      user: userId,
      course: courseId,
      status: 'graded',
    });

    const averageScore = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
      : 0;

    const completion = await CourseCompletion.findOne({
      user: userId,
      course: courseId,
    });

    const streak = await LearningStreak.findOne({
      user: userId,
      type: 'course',
      course: courseId,
    });

    return {
      timeSpent,
      sessions: sessionsCount,
      progress: enrollment?.progressPercentage || 0,
      assignmentsCompleted: submissions.length,
      averageScore,
      lastActivity: lastSession?.startTime || null,
      streak: streak?.currentStreak || 0,
      completionDate: completion?.completedAt,
    };
  } catch (error) {
    logger.error('Error getting course analytics:', error);
    throw error;
  }
};

/**
 * Calculate weekly activity
 */
const calculateWeeklyActivity = (sessions: ILearningSession[]): Array<{
  date: string;
  timeSpent: number;
  sessions: number;
}> => {
  const weeks: { [key: string]: { timeSpent: number; sessions: number } } = {};

  sessions.forEach(session => {
    const date = new Date(session.startTime);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekKey = weekStart.toISOString().split('T')[0];
    if (!weeks[weekKey]) {
      weeks[weekKey] = { timeSpent: 0, sessions: 0 };
    }
    weeks[weekKey].timeSpent += session.duration || 0;
    weeks[weekKey].sessions += 1;
  });

  return Object.entries(weeks)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8); // Last 8 weeks
};

/**
 * Calculate monthly activity
 */
const calculateMonthlyActivity = (sessions: ILearningSession[]): Array<{
  month: string;
  timeSpent: number;
  sessions: number;
}> => {
  const months: { [key: string]: { timeSpent: number; sessions: number } } = {};

  sessions.forEach(session => {
    const date = new Date(session.startTime);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!months[monthKey]) {
      months[monthKey] = { timeSpent: 0, sessions: 0 };
    }
    months[monthKey].timeSpent += session.duration || 0;
    months[monthKey].sessions += 1;
  });

  return Object.entries(months)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
};

/**
 * Get learning calendar (daily activity)
 */
export const getLearningCalendar = async (
  userId: string,
  year: number,
  month: number
): Promise<Array<{
  date: string;
  timeSpent: number;
  sessions: number;
}>> => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const sessions = await LearningSession.find({
      user: userId,
      startTime: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const dailyActivity: { [key: string]: { timeSpent: number; sessions: number } } = {};

    sessions.forEach(session => {
      const date = new Date(session.startTime);
      const dateKey = date.toISOString().split('T')[0];

      if (!dailyActivity[dateKey]) {
        dailyActivity[dateKey] = { timeSpent: 0, sessions: 0 };
      }
      dailyActivity[dateKey].timeSpent += session.duration || 0;
      dailyActivity[dateKey].sessions += 1;
    });

    return Object.entries(dailyActivity)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    logger.error('Error getting learning calendar:', error);
    return [];
  }
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = async (
  userId: string
): Promise<{
  overallAverageScore: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
  strongAreas: string[];
  weakAreas: string[];
  completionRate: number;
}> => {
  try {
    const submissions = await Submission.find({
      user: userId,
      status: 'graded',
    }).sort({ createdAt: 1 });

    if (submissions.length === 0) {
      return {
        overallAverageScore: 0,
        improvementTrend: 'stable',
        strongAreas: [],
        weakAreas: [],
        completionRate: 0,
      };
    }

    const overallAverageScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length;

    // Calculate improvement trend (compare first half vs second half)
    const midPoint = Math.floor(submissions.length / 2);
    const firstHalf = submissions.slice(0, midPoint);
    const secondHalf = submissions.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + (s.score || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + (s.score || 0), 0) / secondHalf.length;

    let improvementTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg + 5) {
      improvementTrend = 'improving';
    } else if (secondHalfAvg < firstHalfAvg - 5) {
      improvementTrend = 'declining';
    }

    // Get course completion rate
    const enrollments = await CourseEnrollment.find({ user: userId });
    const completions = await CourseCompletion.countDocuments({ user: userId });
    const completionRate = enrollments.length > 0 ? (completions / enrollments.length) * 100 : 0;

    // Strong/weak areas (simplified - would need more detailed analysis)
    const strongAreas: string[] = [];
    const weakAreas: string[] = [];

    // Group by course and analyze
    const courseScores: { [key: string]: number[] } = {};
    submissions.forEach(submission => {
      const courseId = submission.course.toString();
      if (!courseScores[courseId]) {
        courseScores[courseId] = [];
      }
      courseScores[courseId].push(submission.score || 0);
    });

    const courses = await Course.find({ _id: { $in: Object.keys(courseScores) } }).select('_id title');
    courses.forEach(course => {
      const scores = courseScores[course._id.toString()];
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      if (avg >= 85) {
        strongAreas.push(course.title);
      } else if (avg < 70) {
        weakAreas.push(course.title);
      }
    });

    return {
      overallAverageScore,
      improvementTrend,
      strongAreas,
      weakAreas,
      completionRate,
    };
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    throw error;
  }
};


import User from '../models/User';
import UserAchievement from '../models/UserAchievement';
import UserBadge from '../models/UserBadge';
import Submission from '../models/Submission';
import Course from '../models/Course';
import ChallengeParticipant from '../models/ChallengeParticipant';
import logger from '../utils/logger';

export type LeaderboardType = 
  | 'global_xp'
  | 'global_achievements'
  | 'global_badges'
  | 'global_level'
  | 'course_xp'
  | 'course_completion'
  | 'friends_xp'
  | 'friends_achievements'
  | 'category_xp'
  | 'category_achievements'
  | 'learning_streak'
  | 'challenge';

export interface LeaderboardEntry {
  rank: number;
  user: {
    _id: string;
    username: string;
    profilePhoto?: string;
    level: number;
    xp: number;
  };
  value: number;
  metadata?: any;
}

/**
 * Get global XP leaderboard
 */
export const getGlobalXPLeaderboard = async (
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> => {
  try {
    const users = await User.find()
      .select('username profilePhoto level xp')
      .sort({ xp: -1 })
      .skip(offset)
      .limit(limit);

    return users.map((user, index) => ({
      rank: offset + index + 1,
      user: {
        _id: user._id.toString(),
        username: user.username,
        profilePhoto: user.profilePhoto,
        level: user.level,
        xp: user.xp,
      },
      value: user.xp,
    }));
  } catch (error) {
    logger.error('Error getting global XP leaderboard:', error);
    return [];
  }
};

/**
 * Get global level leaderboard
 */
export const getGlobalLevelLeaderboard = async (
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> => {
  try {
    const users = await User.find()
      .select('username profilePhoto level xp')
      .sort({ level: -1, xp: -1 })
      .skip(offset)
      .limit(limit);

    return users.map((user, index) => ({
      rank: offset + index + 1,
      user: {
        _id: user._id.toString(),
        username: user.username,
        profilePhoto: user.profilePhoto,
        level: user.level,
        xp: user.xp,
      },
      value: user.level,
    }));
  } catch (error) {
    logger.error('Error getting global level leaderboard:', error);
    return [];
  }
};

/**
 * Get global achievements leaderboard
 */
export const getGlobalAchievementsLeaderboard = async (
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> => {
  try {
    const achievements = await UserAchievement.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $unwind: '$userData',
      },
      {
        $project: {
          _id: '$userData._id',
          username: '$userData.username',
          profilePhoto: '$userData.profilePhoto',
          level: '$userData.level',
          xp: '$userData.xp',
          count: 1,
        },
      },
    ]);

    return achievements.map((entry, index) => ({
      rank: offset + index + 1,
      user: {
        _id: entry._id.toString(),
        username: entry.username,
        profilePhoto: entry.profilePhoto,
        level: entry.level,
        xp: entry.xp,
      },
      value: entry.count,
    }));
  } catch (error) {
    logger.error('Error getting global achievements leaderboard:', error);
    return [];
  }
};

/**
 * Get global badges leaderboard
 */
export const getGlobalBadgesLeaderboard = async (
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> => {
  try {
    const badges = await UserBadge.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $unwind: '$userData',
      },
      {
        $project: {
          _id: '$userData._id',
          username: '$userData.username',
          profilePhoto: '$userData.profilePhoto',
          level: '$userData.level',
          xp: '$userData.xp',
          count: 1,
        },
      },
    ]);

    return badges.map((entry, index) => ({
      rank: offset + index + 1,
      user: {
        _id: entry._id.toString(),
        username: entry.username,
        profilePhoto: entry.profilePhoto,
        level: entry.level,
        xp: entry.xp,
      },
      value: entry.count,
    }));
  } catch (error) {
    logger.error('Error getting global badges leaderboard:', error);
    return [];
  }
};

/**
 * Get course-specific XP leaderboard
 */
export const getCourseXPLeaderboard = async (
  courseId: string,
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> => {
  try {
    // Get users who have submissions for this course
    const submissions = await Submission.find({
      course: courseId,
      status: 'graded',
    }).distinct('user');

    const users = await User.find({
      _id: { $in: submissions },
    })
      .select('username profilePhoto level xp')
      .sort({ xp: -1 })
      .skip(offset)
      .limit(limit);

    return users.map((user, index) => ({
      rank: offset + index + 1,
      user: {
        _id: user._id.toString(),
        username: user.username,
        profilePhoto: user.profilePhoto,
        level: user.level,
        xp: user.xp,
      },
      value: user.xp,
      metadata: { courseId },
    }));
  } catch (error) {
    logger.error('Error getting course XP leaderboard:', error);
    return [];
  }
};

/**
 * Get course completion leaderboard
 */
export const getCourseCompletionLeaderboard = async (
  courseId: string,
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> => {
  try {
    // Get total assignments for the course
    const Assignment = (await import('../models/Assignment')).default;
    const totalAssignments = await Assignment.countDocuments({ course: courseId });

    if (totalAssignments === 0) {
      return [];
    }

    // Get users who completed assignments in this course
    const completedUsers = await Submission.aggregate([
      {
        $match: {
          course: courseId,
          status: 'graded',
        },
      },
      {
        $group: {
          _id: '$user',
          completedAssignments: { $sum: 1 },
        },
      },
      {
        $addFields: {
          totalAssignments: totalAssignments,
        },
      },
      {
        $sort: { completedAssignments: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $unwind: '$userData',
      },
      {
        $project: {
          _id: '$userData._id',
          username: '$userData.username',
          profilePhoto: '$userData.profilePhoto',
          level: '$userData.level',
          xp: '$userData.xp',
          completedAssignments: 1,
          totalAssignments: 1,
        },
      },
    ]);

    return completedUsers.map((entry, index) => ({
      rank: offset + index + 1,
      user: {
        _id: entry._id.toString(),
        username: entry.username,
        profilePhoto: entry.profilePhoto,
        level: entry.level,
        xp: entry.xp,
      },
      value: entry.completedAssignments,
      metadata: { 
        courseId,
        totalAssignments: entry.totalAssignments,
        completionPercentage: Math.round((entry.completedAssignments / entry.totalAssignments) * 100),
      },
    }));
  } catch (error) {
    logger.error('Error getting course completion leaderboard:', error);
    return [];
  }
};

/**
 * Get friends-only leaderboard
 */
export const getFriendsLeaderboard = async (
  userId: string,
  type: 'xp' | 'achievements' | 'badges' | 'level',
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> => {
  try {
    // TODO: Implement friends system
    // For now, return empty array
    // This will need to query a friends/follows relationship
    return [];
  } catch (error) {
    logger.error('Error getting friends leaderboard:', error);
    return [];
  }
};

/**
 * Get category-based leaderboard
 */
export const getCategoryLeaderboard = async (
  category: string,
  type: 'xp' | 'achievements',
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> => {
  try {
    if (type === 'xp') {
      // Get users with XP in a specific category (would need category tracking)
      // For now, return global XP leaderboard
      return getGlobalXPLeaderboard(limit, offset);
    } else {
      // Get achievements by category
      const achievements = await UserAchievement.aggregate([
        {
          $lookup: {
            from: 'achievements',
            localField: 'achievement',
            foreignField: '_id',
            as: 'achievementData',
          },
        },
        {
          $unwind: '$achievementData',
        },
        {
          $match: {
            'achievementData.category': category,
          },
        },
        {
          $group: {
            _id: '$user',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $skip: offset,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userData',
          },
        },
        {
          $unwind: '$userData',
        },
        {
          $project: {
            _id: '$userData._id',
            username: '$userData.username',
            profilePhoto: '$userData.profilePhoto',
            level: '$userData.level',
            xp: '$userData.xp',
            count: 1,
          },
        },
      ]);

      return achievements.map((entry, index) => ({
        rank: offset + index + 1,
        user: {
          _id: entry._id.toString(),
          username: entry.username,
          profilePhoto: entry.profilePhoto,
          level: entry.level,
          xp: entry.xp,
        },
        value: entry.count,
        metadata: { category },
      }));
    }
  } catch (error) {
    logger.error('Error getting category leaderboard:', error);
    return [];
  }
};

/**
 * Get learning streak leaderboard
 */
export const getLearningStreakLeaderboard = async (
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> => {
  try {
    // TODO: Implement streak tracking
    // For now, return empty array
    return [];
  } catch (error) {
    logger.error('Error getting learning streak leaderboard:', error);
    return [];
  }
};

/**
 * Get challenge leaderboard (reuses challenge service)
 */
export const getChallengeLeaderboard = async (
  challengeId: string,
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> => {
  try {
    const { getChallengeLeaderboard: getChallengeLeaderboardService } = await import('./challengeService');
    const participants = await getChallengeLeaderboardService(challengeId, limit + offset);
    
    return participants.slice(offset).map((participant: any, index: number) => ({
      rank: offset + index + 1,
      user: {
        _id: participant.user._id.toString(),
        username: participant.user.username,
        profilePhoto: participant.user.profilePhoto,
        level: participant.user.level,
        xp: participant.user.xp,
      },
      value: participant.currentValue,
      metadata: {
        challengeId,
        progressPercentage: participant.progressPercentage,
        isCompleted: participant.isCompleted,
      },
    }));
  } catch (error) {
    logger.error('Error getting challenge leaderboard:', error);
    return [];
  }
};

/**
 * Get user's rank in a leaderboard
 */
export const getUserRank = async (
  userId: string,
  type: LeaderboardType,
  courseId?: string,
  challengeId?: string,
  category?: string
): Promise<number | null> => {
  try {
    let rank = null;

    switch (type) {
      case 'global_xp':
        const user = await User.findById(userId).select('xp');
        if (!user) return null;
        const usersWithMoreXP = await User.countDocuments({ xp: { $gt: user.xp } });
        rank = usersWithMoreXP + 1;
        break;

      case 'global_level':
        const userLevel = await User.findById(userId).select('level xp');
        if (!userLevel) return null;
        const usersWithHigherLevel = await User.countDocuments({
          $or: [
            { level: { $gt: userLevel.level } },
            { level: userLevel.level, xp: { $gt: userLevel.xp } },
          ],
        });
        rank = usersWithHigherLevel + 1;
        break;

      case 'global_achievements':
        const userAchievements = await UserAchievement.countDocuments({ user: userId });
        const usersWithMoreAchievements = await UserAchievement.aggregate([
          {
            $group: {
              _id: '$user',
              count: { $sum: 1 },
            },
          },
          {
            $match: {
              count: { $gt: userAchievements },
            },
          },
          {
            $count: 'total',
          },
        ]);
        rank = (usersWithMoreAchievements[0]?.total || 0) + 1;
        break;

      case 'global_badges':
        const userBadges = await UserBadge.countDocuments({ user: userId });
        const usersWithMoreBadges = await UserBadge.aggregate([
          {
            $group: {
              _id: '$user',
              count: { $sum: 1 },
            },
          },
          {
            $match: {
              count: { $gt: userBadges },
            },
          },
          {
            $count: 'total',
          },
        ]);
        rank = (usersWithMoreBadges[0]?.total || 0) + 1;
        break;

      case 'course_xp':
        if (!courseId) return null;
        const courseUser = await User.findById(userId).select('xp');
        if (!courseUser) return null;
        const courseSubmissions = await Submission.find({
          course: courseId,
          status: 'graded',
        }).distinct('user');
        const courseUsersWithMoreXP = await User.countDocuments({
          _id: { $in: courseSubmissions },
          xp: { $gt: courseUser.xp },
        });
        rank = courseUsersWithMoreXP + 1;
        break;

      case 'challenge':
        if (!challengeId) return null;
        const participant = await ChallengeParticipant.findOne({
          challenge: challengeId,
          user: userId,
        });
        if (!participant) return null;
        rank = participant.rank || null;
        break;

      default:
        return null;
    }

    return rank;
  } catch (error) {
    logger.error('Error getting user rank:', error);
    return null;
  }
};


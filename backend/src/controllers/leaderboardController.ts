import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import {
  getGlobalXPLeaderboard,
  getGlobalLevelLeaderboard,
  getGlobalAchievementsLeaderboard,
  getGlobalBadgesLeaderboard,
  getCourseXPLeaderboard,
  getCourseCompletionLeaderboard,
  getFriendsLeaderboard,
  getCategoryLeaderboard,
  getLearningStreakLeaderboard,
  getChallengeLeaderboard,
  getUserRank,
  LeaderboardType,
} from '../services/leaderboardService';

// @desc    Get leaderboard
// @route   GET /api/leaderboards/:type
// @access  Public
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const { courseId, challengeId, category, limit = 100, offset = 0, userId } = req.query;

  let leaderboard: any[] = [];
  let userRank: number | null = null;

  switch (type) {
    case 'global-xp':
      leaderboard = await getGlobalXPLeaderboard(Number(limit), Number(offset));
      if (userId) {
        userRank = await getUserRank(userId as string, 'global_xp');
      }
      break;

    case 'global-level':
      leaderboard = await getGlobalLevelLeaderboard(Number(limit), Number(offset));
      if (userId) {
        userRank = await getUserRank(userId as string, 'global_level');
      }
      break;

    case 'global-achievements':
      leaderboard = await getGlobalAchievementsLeaderboard(Number(limit), Number(offset));
      if (userId) {
        userRank = await getUserRank(userId as string, 'global_achievements');
      }
      break;

    case 'global-badges':
      leaderboard = await getGlobalBadgesLeaderboard(Number(limit), Number(offset));
      if (userId) {
        userRank = await getUserRank(userId as string, 'global_badges');
      }
      break;

    case 'course-xp':
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required',
        });
      }
      leaderboard = await getCourseXPLeaderboard(courseId as string, Number(limit), Number(offset));
      if (userId) {
        userRank = await getUserRank(userId as string, 'course_xp', courseId as string);
      }
      break;

    case 'course-completion':
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required',
        });
      }
      leaderboard = await getCourseCompletionLeaderboard(courseId as string, Number(limit), Number(offset));
      break;

    case 'friends-xp':
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }
      leaderboard = await getFriendsLeaderboard(userId as string, 'xp', Number(limit), Number(offset));
      break;

    case 'friends-achievements':
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }
      leaderboard = await getFriendsLeaderboard(userId as string, 'achievements', Number(limit), Number(offset));
      break;

    case 'friends-badges':
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }
      leaderboard = await getFriendsLeaderboard(userId as string, 'badges', Number(limit), Number(offset));
      break;

    case 'friends-level':
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }
      leaderboard = await getFriendsLeaderboard(userId as string, 'level', Number(limit), Number(offset));
      break;

    case 'category-xp':
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required',
        });
      }
      leaderboard = await getCategoryLeaderboard(category as string, 'xp', Number(limit), Number(offset));
      break;

    case 'category-achievements':
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required',
        });
      }
      leaderboard = await getCategoryLeaderboard(category as string, 'achievements', Number(limit), Number(offset));
      break;

    case 'learning-streak':
      leaderboard = await getLearningStreakLeaderboard(Number(limit), Number(offset));
      break;

    case 'challenge':
      if (!challengeId) {
        return res.status(400).json({
          success: false,
          message: 'Challenge ID is required',
        });
      }
      leaderboard = await getChallengeLeaderboard(challengeId as string, Number(limit), Number(offset));
      if (userId) {
        userRank = await getUserRank(userId as string, 'challenge', undefined, challengeId as string);
      }
      break;

    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid leaderboard type',
      });
  }

  res.json({
    success: true,
    type,
    count: leaderboard.length,
    leaderboard,
    userRank,
  });
});

// @desc    Get user's rank in a leaderboard
// @route   GET /api/leaderboards/:type/rank
// @access  Public
export const getUserLeaderboardRank = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const { userId, courseId, challengeId, category } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }

  let rank: number | null = null;

  switch (type) {
    case 'global-xp':
      rank = await getUserRank(userId as string, 'global_xp');
      break;
    case 'global-level':
      rank = await getUserRank(userId as string, 'global_level');
      break;
    case 'global-achievements':
      rank = await getUserRank(userId as string, 'global_achievements');
      break;
    case 'global-badges':
      rank = await getUserRank(userId as string, 'global_badges');
      break;
    case 'course-xp':
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required',
        });
      }
      rank = await getUserRank(userId as string, 'course_xp', courseId as string);
      break;
    case 'challenge':
      if (!challengeId) {
        return res.status(400).json({
          success: false,
          message: 'Challenge ID is required',
        });
      }
      rank = await getUserRank(userId as string, 'challenge', undefined, challengeId as string);
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid leaderboard type',
      });
  }

  res.json({
    success: true,
    type,
    userId,
    rank,
  });
});


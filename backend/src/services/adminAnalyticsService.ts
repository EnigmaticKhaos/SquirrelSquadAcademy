import User from '../models/User';
import Course from '../models/Course';
import CourseCompletion from '../models/CourseCompletion';
import CourseEnrollment from '../models/CourseEnrollment';
import CourseReview from '../models/CourseReview';
import CourseSuggestion from '../models/CourseSuggestion';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Like from '../models/Like';
import UserXP from '../models/UserXP';
import Achievement from '../models/Achievement';
import Badge from '../models/Badge';
import UserAchievement from '../models/UserAchievement';
import UserBadge from '../models/UserBadge';
import Referral from '../models/Referral';
import Project from '../models/Project';
import CollaborativeProject from '../models/CollaborativeProject';
import ContentReport from '../models/ContentReport';
import UserWarning from '../models/UserWarning';
import MentorApplication from '../models/MentorApplication';
import Mentorship from '../models/Mentorship';
import LearningSession from '../models/LearningSession';
import LearningStreak from '../models/LearningStreak';
import Announcement from '../models/Announcement';
import logger from '../utils/logger';

/**
 * Get user analytics
 */
export const getUserAnalytics = async (options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<any> => {
  try {
    const { startDate, endDate } = options || {};
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const [
      totalUsers,
      newUsers,
      activeUsers,
      premiumUsers,
      freeUsers,
      verifiedUsers,
      usersWith2FA,
      totalMentors,
      activeMentors,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments(dateFilter),
      User.countDocuments({ onlineStatus: 'online' }),
      User.countDocuments({ 'subscription.tier': 'premium' }),
      User.countDocuments({ 'subscription.tier': 'free' }),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ twoFactorEnabled: true }),
      User.countDocuments({ 'mentorStatus.isMentor': true }),
      User.countDocuments({ 'mentorStatus.isMentor': true, 'mentorStatus.isAvailable': true }),
    ]);

    // User growth over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyUserGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Average user level
    const avgLevelResult = await User.aggregate([
      {
        $group: {
          _id: null,
          avgLevel: { $avg: '$level' },
          avgXP: { $avg: '$xp' },
        },
      },
    ]);

    return {
      total: totalUsers,
      new: newUsers,
      active: activeUsers,
      premium: premiumUsers,
      free: freeUsers,
      verified: verifiedUsers,
      with2FA: usersWith2FA,
      mentors: {
        total: totalMentors,
        active: activeMentors,
      },
      growth: {
        daily: dailyUserGrowth,
      },
      averages: {
        level: avgLevelResult[0]?.avgLevel || 0,
        xp: avgLevelResult[0]?.avgXP || 0,
      },
    };
  } catch (error) {
    logger.error('Error getting user analytics:', error);
    throw error;
  }
};

/**
 * Get course analytics
 */
export const getCourseAnalytics = async (options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<any> => {
  try {
    const { startDate, endDate } = options || {};
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      comingSoonCourses,
      codingCourses,
      nonCodingCourses,
      totalEnrollments,
      totalCompletions,
      totalReviews,
    ] = await Promise.all([
      Course.countDocuments(),
      Course.countDocuments({ status: 'published' }),
      Course.countDocuments({ status: 'draft' }),
      Course.countDocuments({ status: 'coming_soon' }),
      Course.countDocuments({ courseType: 'coding' }),
      Course.countDocuments({ courseType: 'non-coding' }),
      CourseEnrollment.countDocuments(),
      CourseCompletion.countDocuments(),
      CourseReview.countDocuments(),
    ]);

    // Popular courses (by enrollment)
    const popularCourses = await Course.aggregate([
      {
        $lookup: {
          from: 'courseenrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments',
        },
      },
      {
        $project: {
          title: 1,
          status: 1,
          courseType: 1,
          enrollmentCount: { $size: '$enrollments' },
        },
      },
      {
        $sort: { enrollmentCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Course completion rates
    const completionRates = await Course.aggregate([
      {
        $lookup: {
          from: 'courseenrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments',
        },
      },
      {
        $lookup: {
          from: 'coursecompletions',
          localField: '_id',
          foreignField: 'course',
          as: 'completions',
        },
      },
      {
        $project: {
          title: 1,
          enrollmentCount: { $size: '$enrollments' },
          completionCount: { $size: '$completions' },
          completionRate: {
            $cond: {
              if: { $gt: [{ $size: '$enrollments' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $size: '$completions' },
                      { $size: '$enrollments' },
                    ],
                  },
                  100,
                ],
              },
              else: 0,
            },
          },
        },
      },
      {
        $sort: { completionRate: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Course popularity trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const courseTrends = await CourseEnrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Average course rating
    const avgRatingResult = await CourseReview.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    return {
      total: totalCourses,
      published: publishedCourses,
      draft: draftCourses,
      comingSoon: comingSoonCourses,
      byType: {
        coding: codingCourses,
        nonCoding: nonCodingCourses,
      },
      enrollments: totalEnrollments,
      completions: totalCompletions,
      reviews: totalReviews,
      popular: popularCourses,
      completionRates,
      trends: {
        enrollments: courseTrends,
      },
      averageRating: avgRatingResult[0]?.avgRating || 0,
    };
  } catch (error) {
    logger.error('Error getting course analytics:', error);
    throw error;
  }
};

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = async (options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<any> => {
  try {
    const { startDate, endDate } = options || {};
    
    // Get premium users
    const premiumUsers = await User.countDocuments({ 'subscription.tier': 'premium' });
    const freeUsers = await User.countDocuments({ 'subscription.tier': 'free' });
    
    // Calculate conversion rate
    const totalUsers = premiumUsers + freeUsers;
    const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

    // Revenue trends (last 30 days) - would need Stripe data
    // For now, we'll use subscription creation dates
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const subscriptionTrends = await User.aggregate([
      {
        $match: {
          'subscription.tier': 'premium',
          'subscription.currentPeriodEnd': { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$subscription.currentPeriodEnd',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      premiumUsers,
      freeUsers,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      trends: {
        subscriptions: subscriptionTrends,
      },
      // Note: Actual revenue would come from Stripe webhooks/API
      // This would need to be stored in a separate Revenue model
    };
  } catch (error) {
    logger.error('Error getting revenue analytics:', error);
    throw error;
  }
};

/**
 * Get gamification analytics
 */
export const getGamificationAnalytics = async (): Promise<any> => {
  try {
    const [
      totalXP,
      totalAchievements,
      totalBadges,
      unlockedAchievements,
      earnedBadges,
      totalAchievementTypes,
      totalBadgeTypes,
    ] = await Promise.all([
      UserXP.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Achievement.countDocuments(),
      Badge.countDocuments(),
      UserAchievement.countDocuments(),
      UserBadge.countDocuments(),
      Achievement.distinct('tier'),
      Badge.distinct('tier'),
    ]);

    // XP distribution by source
    const xpBySource = await UserXP.aggregate([
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    // Achievement unlocks by tier
    const achievementsByTier = await UserAchievement.aggregate([
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
        $group: {
          _id: '$achievementData.tier',
          count: { $sum: 1 },
        },
      },
    ]);

    // Badge earnings by tier
    const badgesByTier = await UserBadge.aggregate([
      {
        $lookup: {
          from: 'badges',
          localField: 'badge',
          foreignField: '_id',
          as: 'badgeData',
        },
      },
      {
        $unwind: '$badgeData',
      },
      {
        $group: {
          _id: '$badgeData.tier',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      xp: {
        total: totalXP[0]?.total || 0,
        bySource: xpBySource,
      },
      achievements: {
        total: totalAchievements,
        unlocked: unlockedAchievements,
        tiers: totalAchievementTypes.length,
        byTier: achievementsByTier,
      },
      badges: {
        total: totalBadges,
        earned: earnedBadges,
        tiers: totalBadgeTypes.length,
        byTier: badgesByTier,
      },
    };
  } catch (error) {
    logger.error('Error getting gamification analytics:', error);
    throw error;
  }
};

/**
 * Get social analytics
 */
export const getSocialAnalytics = async (options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<any> => {
  try {
    const { startDate, endDate } = options || {};
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const [
      totalPosts,
      totalComments,
      totalLikes,
      postsWithImages,
      postsWithVideos,
    ] = await Promise.all([
      Post.countDocuments(dateFilter),
      Comment.countDocuments(dateFilter),
      Like.countDocuments(dateFilter),
      Post.countDocuments({ ...dateFilter, media: { $exists: true, $ne: [] } }),
      Post.countDocuments({ ...dateFilter, 'media.type': 'video' }),
    ]);

    // Engagement trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const engagementTrends = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          posts: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Most liked posts
    const topPosts = await Post.aggregate([
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'targetId',
          as: 'likes',
        },
      },
      {
        $project: {
          content: { $substr: ['$content', 0, 50] },
          author: 1,
          likeCount: { $size: '$likes' },
          createdAt: 1,
        },
      },
      {
        $sort: { likeCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return {
      posts: {
        total: totalPosts,
        withImages: postsWithImages,
        withVideos: postsWithVideos,
      },
      comments: totalComments,
      likes: totalLikes,
      trends: {
        engagement: engagementTrends,
      },
      topPosts,
    };
  } catch (error) {
    logger.error('Error getting social analytics:', error);
    throw error;
  }
};

/**
 * Get learning analytics
 */
export const getLearningAnalytics = async (options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<any> => {
  try {
    const { startDate, endDate } = options || {};
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const [
      totalSessions,
      totalStreaks,
      activeStreaks,
      totalLearningTime,
    ] = await Promise.all([
      LearningSession.countDocuments(dateFilter),
      LearningStreak.countDocuments(),
      LearningStreak.countDocuments({ isActive: true }),
      LearningSession.aggregate([
        {
          $match: dateFilter,
        },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: '$durationMinutes' },
          },
        },
      ]),
    ]);

    // Average session duration
    const avgSessionDuration = await LearningSession.aggregate([
      {
        $match: dateFilter,
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$durationMinutes' },
        },
      },
    ]);

    // Learning trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const learningTrends = await LearningSession.aggregate([
      {
        $match: {
          startTime: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
          },
          sessions: { $sum: 1 },
          totalMinutes: { $sum: '$durationMinutes' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Course completion rate
    const completionStats = await CourseCompletion.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          passed: {
            $sum: {
              $cond: [{ $eq: ['$passed', true] }, 1, 0],
            },
          },
        },
      },
    ]);

    const completionRate = completionStats[0]?.total > 0
      ? (completionStats[0].passed / completionStats[0].total) * 100
      : 0;

    return {
      sessions: {
        total: totalSessions,
        averageDuration: avgSessionDuration[0]?.avgDuration || 0,
      },
      streaks: {
        total: totalStreaks,
        active: activeStreaks,
      },
      totalLearningTime: {
        minutes: totalLearningTime[0]?.totalMinutes || 0,
        hours: (totalLearningTime[0]?.totalMinutes || 0) / 60,
      },
      trends: {
        learning: learningTrends,
      },
      completionRate: parseFloat(completionRate.toFixed(2)),
    };
  } catch (error) {
    logger.error('Error getting learning analytics:', error);
    throw error;
  }
};

/**
 * Get referral analytics
 */
export const getReferralAnalytics = async (): Promise<any> => {
  try {
    const [
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalReferrers,
    ] = await Promise.all([
      Referral.countDocuments(),
      Referral.countDocuments({ completed: true }),
      Referral.countDocuments({ completed: false }),
      Referral.distinct('referrer'),
    ]);

    // Top referrers
    const topReferrers = await Referral.aggregate([
      {
        $group: {
          _id: '$referrer',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$completed', true] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { completed: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return {
      total: totalReferrals,
      completed: completedReferrals,
      pending: pendingReferrals,
      totalReferrers: totalReferrers.length,
      topReferrers,
    };
  } catch (error) {
    logger.error('Error getting referral analytics:', error);
    throw error;
  }
};

/**
 * Get project analytics
 */
export const getProjectAnalytics = async (): Promise<any> => {
  try {
    const [
      totalProjects,
      sharedProjects,
      collaborativeProjects,
      activeCollaborativeProjects,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ isPublic: true }),
      CollaborativeProject.countDocuments(),
      CollaborativeProject.countDocuments({ status: 'active' }),
    ]);

    return {
      total: totalProjects,
      shared: sharedProjects,
      collaborative: {
        total: collaborativeProjects,
        active: activeCollaborativeProjects,
      },
    };
  } catch (error) {
    logger.error('Error getting project analytics:', error);
    throw error;
  }
};

/**
 * Get moderation analytics
 */
export const getModerationAnalytics = async (): Promise<any> => {
  try {
    const [
      totalReports,
      pendingReports,
      resolvedReports,
      totalWarnings,
      activeWarnings,
      bannedUsers,
      suspendedUsers,
    ] = await Promise.all([
      ContentReport.countDocuments(),
      ContentReport.countDocuments({ status: 'pending' }),
      ContentReport.countDocuments({ status: 'resolved' }),
      UserWarning.countDocuments(),
      UserWarning.countDocuments({ isActive: true }),
      User.countDocuments({ 'moderationStatus.isBanned': true }),
      User.countDocuments({ 'moderationStatus.isSuspended': true }),
    ]);

    // Reports by type
    const reportsByType = await ContentReport.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return {
      reports: {
        total: totalReports,
        pending: pendingReports,
        resolved: resolvedReports,
        byType: reportsByType,
      },
      warnings: {
        total: totalWarnings,
        active: activeWarnings,
      },
      users: {
        banned: bannedUsers,
        suspended: suspendedUsers,
      },
    };
  } catch (error) {
    logger.error('Error getting moderation analytics:', error);
    throw error;
  }
};

/**
 * Get mentor application analytics
 */
export const getMentorApplicationAnalytics = async (): Promise<any> => {
  try {
    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      autoApproveCount,
      reviewCount,
      autoRejectCount,
    ] = await Promise.all([
      MentorApplication.countDocuments(),
      MentorApplication.countDocuments({ status: 'pending' }),
      MentorApplication.countDocuments({ status: 'approved' }),
      MentorApplication.countDocuments({ status: 'rejected' }),
      MentorApplication.countDocuments({ status: 'pending', priority: 'auto_approve' }),
      MentorApplication.countDocuments({ status: 'pending', priority: 'review' }),
      MentorApplication.countDocuments({ status: 'pending', priority: 'auto_reject' }),
    ]);

    // Active mentorships
    const activeMentorships = await Mentorship.countDocuments({ status: 'active' });
    const completedMentorships = await Mentorship.countDocuments({ status: 'completed' });

    return {
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        byPriority: {
          autoApprove: autoApproveCount,
          review: reviewCount,
          autoReject: autoRejectCount,
        },
      },
      mentorships: {
        active: activeMentorships,
        completed: completedMentorships,
      },
    };
  } catch (error) {
    logger.error('Error getting mentor application analytics:', error);
    throw error;
  }
};

/**
 * Get comprehensive dashboard analytics
 */
export const getDashboardAnalytics = async (options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<any> => {
  try {
    const [
      users,
      courses,
      revenue,
      gamification,
      social,
      learning,
      referrals,
      projects,
      moderation,
      mentorApplications,
    ] = await Promise.all([
      getUserAnalytics(options),
      getCourseAnalytics(options),
      getRevenueAnalytics(options),
      getGamificationAnalytics(),
      getSocialAnalytics(options),
      getLearningAnalytics(options),
      getReferralAnalytics(),
      getProjectAnalytics(),
      getModerationAnalytics(),
      getMentorApplicationAnalytics(),
    ]);

    return {
      users,
      courses,
      revenue,
      gamification,
      social,
      learning,
      referrals,
      projects,
      moderation,
      mentorApplications,
      generatedAt: new Date(),
    };
  } catch (error) {
    logger.error('Error getting dashboard analytics:', error);
    throw error;
  }
};


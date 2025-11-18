import User from '../models/User';
import UserXP from '../models/UserXP';
import { XPSource } from '../models/UserXP';
import logger from '../utils/logger';
import { calculateLevel, hasLeveledUp } from '../utils/levelCalculator';

interface AwardXPOptions {
  userId: string;
  amount: number;
  source: XPSource;
  sourceId?: string;
  description?: string;
}

export const awardXP = async (options: AwardXPOptions): Promise<{ leveledUp: boolean; newLevel?: number }> => {
  try {
    const { userId, amount, source, sourceId, description } = options;

    // Get current user to check old XP and level
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const oldXP = user.xp;
    const oldLevel = user.level;
    const newXP = oldXP + amount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = hasLeveledUp(oldXP, newXP);

    // Update user XP and level
    await User.findByIdAndUpdate(userId, {
      $inc: { xp: amount },
      $set: { level: newLevel },
    });

    // Log XP transaction
    await UserXP.create({
      user: userId,
      amount,
      source,
      sourceId,
      description,
    });

    logger.info(`Awarded ${amount} XP to user ${userId} for ${source}. Level: ${oldLevel} -> ${newLevel}`);

    // Send level up notification
    if (leveledUp) {
      import('./notificationService').then(({ createNotification }) => {
        createNotification(userId, 'level_up', {
          title: '🎉 Level Up!',
          message: `Congratulations! You've reached level ${newLevel}!`,
          actionUrl: `/profile/${userId}`,
          priority: 'high',
        }).catch((error) => {
          logger.error('Error sending level up notification:', error);
        });
      });
    }

    // Check achievements, badges, goals, and challenges for XP earned and level up
    import('./achievementService').then(({ checkAchievementsForTrigger }) => {
      // Check XP-based achievements
      checkAchievementsForTrigger({
        userId,
        triggerType: 'xp_earned',
        triggerData: { oldXP, newXP, amount },
      }).catch((error) => {
        logger.error('Error checking achievements for XP:', error);
      });

      // Check level-up achievements
      if (leveledUp) {
        checkAchievementsForTrigger({
          userId,
          triggerType: 'level_up',
          triggerData: { oldLevel, newLevel },
        }).catch((error) => {
          logger.error('Error checking achievements for level up:', error);
        });
      }
    });
    import('./badgeService').then(({ checkBadgesForTrigger }) => {
      // Check XP-based badges
      checkBadgesForTrigger({
        userId,
        triggerType: 'xp_earned',
        triggerData: { oldXP, newXP, amount },
      }).catch((error) => {
        logger.error('Error checking badges for XP:', error);
      });

      // Check level-up badges
      if (leveledUp) {
        checkBadgesForTrigger({
          userId,
          triggerType: 'level_up',
          triggerData: { oldLevel, newLevel },
        }).catch((error) => {
          logger.error('Error checking badges for level up:', error);
        });
      }
    });
    import('./learningGoalService').then(({ checkGoalsForTrigger }) => {
      // Check XP-based goals
      checkGoalsForTrigger(userId, 'xp_earned').catch((error) => {
        logger.error('Error checking goals for XP:', error);
      });

      // Check level-up goals
      if (leveledUp) {
        checkGoalsForTrigger(userId, 'level_up').catch((error) => {
          logger.error('Error checking goals for level up:', error);
        });
      }
    });
    import('./challengeService').then(({ checkChallengesForTrigger }) => {
      // Check XP-based challenges
      checkChallengesForTrigger(userId, 'xp_earned').catch((error) => {
        logger.error('Error checking challenges for XP:', error);
      });

      // Check level-up challenges
      if (leveledUp) {
        checkChallengesForTrigger(userId, 'level_up').catch((error) => {
          logger.error('Error checking challenges for level up:', error);
        });
      }
    });

    return {
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  } catch (error) {
    logger.error('Error awarding XP:', error);
    throw error;
  }
};

// XP amounts for different actions
export const XP_AMOUNTS = {
  LESSON_COMPLETED: 50,
  QUIZ_PASSED: 100,
  ASSIGNMENT_SUBMITTED: 75,
  POST_CREATED: 10,
  COMMENT_CREATED: 5,
  LIKE_RECEIVED: 2,
  DAILY_LOGIN: 25,
  STREAK_MILESTONE: 100,
  PROJECT_SHARED: 50,
  ACHIEVEMENT_UNLOCKED: 200,
  BADGE_EARNED: 150,
};


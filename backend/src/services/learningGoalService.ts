import LearningGoal, { GoalType } from '../models/LearningGoal';
import User from '../models/User';
import Submission from '../models/Submission';
import Project from '../models/Project';
import { awardXP } from './xpService';
import logger from '../utils/logger';

/**
 * Update goal progress based on type
 */
export const updateGoalProgress = async (
  goalId: string,
  userId: string
): Promise<boolean> => {
  try {
    const goal = await LearningGoal.findOne({
      _id: goalId,
      user: userId,
      status: 'active',
    });

    if (!goal) {
      return false;
    }

    let newCurrentValue = 0;

    switch (goal.type) {
      case 'complete_courses':
        const completedCourses = await Submission.find({
          user: userId,
          status: 'graded',
        }).distinct('course');
        newCurrentValue = completedCourses.length;
        break;

      case 'earn_xp':
        const user = await User.findById(userId).select('xp');
        newCurrentValue = user?.xp || 0;
        break;

      case 'reach_level':
        const userLevel = await User.findById(userId).select('level');
        newCurrentValue = userLevel?.level || 1;
        break;

      case 'complete_assignments':
        newCurrentValue = await Submission.countDocuments({
          user: userId,
          status: 'graded',
        });
        break;

      case 'complete_lessons':
        // TODO: Implement lesson completion tracking
        newCurrentValue = 0;
        break;

      case 'maintain_streak':
        // TODO: Implement streak tracking
        newCurrentValue = 0;
        break;

      case 'share_projects':
        newCurrentValue = await Project.countDocuments({
          user: userId,
          isPublic: true,
        });
        break;

      case 'custom':
        // Custom goals would need custom logic based on customCriteria
        // For now, we'll leave it as is
        break;
    }

    // Calculate progress percentage
    const progressPercentage = goal.targetValue > 0
      ? Math.min(100, Math.round((newCurrentValue / goal.targetValue) * 100))
      : 0;

    // Check if goal is completed
    if (newCurrentValue >= goal.targetValue && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAt = new Date();
      goal.currentValue = newCurrentValue;
      goal.progressPercentage = 100;

      // Award rewards
      if (goal.xpReward && goal.xpReward > 0) {
        await awardXP({
          userId,
          amount: goal.xpReward,
          source: 'goal_completed',
          sourceId: goalId,
          description: `Goal completed: ${goal.title}`,
        });
      }

      // TODO: Award badge/achievement rewards if set

      logger.info(`Goal completed: ${goal.title} by user ${userId}`);
    } else {
      goal.currentValue = newCurrentValue;
      goal.progressPercentage = progressPercentage;
    }

    // Check if goal has failed (past deadline)
    if (goal.hasDeadline && goal.deadline && goal.status === 'active') {
      if (new Date() > goal.deadline && newCurrentValue < goal.targetValue) {
        goal.status = 'failed';
        logger.info(`Goal failed: ${goal.title} by user ${userId}`);
      }
    }

    await goal.save();
    return true;
  } catch (error) {
    logger.error('Error updating goal progress:', error);
    return false;
  }
};

/**
 * Update all active goals for a user
 */
export const updateAllUserGoals = async (userId: string): Promise<void> => {
  try {
    const activeGoals = await LearningGoal.find({
      user: userId,
      status: 'active',
    });

    for (const goal of activeGoals) {
      await updateGoalProgress(goal._id.toString(), userId);
    }
  } catch (error) {
    logger.error('Error updating all user goals:', error);
  }
};

/**
 * Check and update goals based on trigger type
 */
export const checkGoalsForTrigger = async (
  userId: string,
  triggerType: string
): Promise<void> => {
  try {
    // Get goals that might be affected by this trigger
    const relevantGoalTypes = getRelevantGoalTypes(triggerType);
    
    const goals = await LearningGoal.find({
      user: userId,
      status: 'active',
      type: { $in: relevantGoalTypes },
    });

    for (const goal of goals) {
      await updateGoalProgress(goal._id.toString(), userId);
    }
  } catch (error) {
    logger.error('Error checking goals for trigger:', error);
  }
};

/**
 * Get relevant goal types based on trigger type
 */
const getRelevantGoalTypes = (triggerType: string): GoalType[] => {
  const mapping: { [key: string]: GoalType[] } = {
    course_completed: ['complete_courses'],
    assignment_submitted: ['complete_assignments'],
    quiz_passed: ['complete_assignments'],
    xp_earned: ['earn_xp'],
    level_up: ['reach_level'],
    project_shared: ['share_projects'],
    daily_login: ['maintain_streak'],
  };

  return mapping[triggerType] || [];
};

/**
 * Calculate goal statistics for a user
 */
export const getUserGoalStats = async (userId: string) => {
  const totalGoals = await LearningGoal.countDocuments({ user: userId });
  const activeGoals = await LearningGoal.countDocuments({
    user: userId,
    status: 'active',
  });
  const completedGoals = await LearningGoal.countDocuments({
    user: userId,
    status: 'completed',
  });
  const failedGoals = await LearningGoal.countDocuments({
    user: userId,
    status: 'failed',
  });

  const goalsByType = await LearningGoal.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    total: totalGoals,
    active: activeGoals,
    completed: completedGoals,
    failed: failedGoals,
    byType: goalsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [key: string]: number }),
  };
};


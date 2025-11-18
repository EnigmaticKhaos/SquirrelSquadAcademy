import Challenge from '../models/Challenge';
import ChallengeParticipant from '../models/ChallengeParticipant';
import User from '../models/User';
import Submission from '../models/Submission';
import Project from '../models/Project';
import Post from '../models/Post';
import Comment from '../models/Comment';
import { awardXP } from './xpService';
import logger from '../utils/logger';

/**
 * Check if user is eligible for a challenge
 */
export const checkEligibility = async (
  userId: string,
  challenge: any
): Promise<{ eligible: boolean; reason?: string }> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { eligible: false, reason: 'User not found' };
    }

    const eligibility = challenge.eligibilityCriteria;
    if (!eligibility) {
      return { eligible: true };
    }

    // Check minimum level
    if (eligibility.minLevel && user.level < eligibility.minLevel) {
      return { eligible: false, reason: `Minimum level ${eligibility.minLevel} required` };
    }

    // Check minimum XP
    if (eligibility.minXP && user.xp < eligibility.minXP) {
      return { eligible: false, reason: `Minimum ${eligibility.minXP} XP required` };
    }

    // Check subscription tier
    if (eligibility.subscriptionTier && eligibility.subscriptionTier !== 'all') {
      if (user.subscription.tier !== eligibility.subscriptionTier) {
        return { eligible: false, reason: `${eligibility.subscriptionTier} subscription required` };
      }
    }

    return { eligible: true };
  } catch (error) {
    logger.error('Error checking challenge eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
};

/**
 * Join a challenge (optional bonus opportunity)
 * Challenges are optional and provide bonus XP and extra credit rewards
 */
export const joinChallenge = async (
  userId: string,
  challengeId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return { success: false, message: 'Challenge not found' };
    }

    // Check if challenge is active or upcoming
    if (challenge.status === 'ended') {
      return { success: false, message: 'Challenge has ended' };
    }

    // Check if challenge has reached max participants
    if (challenge.maxParticipants && challenge.participantCount >= challenge.maxParticipants) {
      return { success: false, message: 'Challenge is full' };
    }

    // Check eligibility
    const eligibility = await checkEligibility(userId, challenge);
    if (!eligibility.eligible) {
      return { success: false, message: eligibility.reason || 'Not eligible for this challenge' };
    }

    // Check if user is already participating
    const existing = await ChallengeParticipant.findOne({
      challenge: challengeId,
      user: userId,
    });

    if (existing) {
      return { success: false, message: 'Already participating in this challenge' };
    }

    // Create participant
    await ChallengeParticipant.create({
      challenge: challengeId,
      user: userId,
      currentValue: 0,
      progressPercentage: 0,
      isCompleted: false,
    });

    // Increment participant count
    challenge.participantCount += 1;
    await challenge.save();

    logger.info(`User ${userId} joined challenge ${challengeId}`);
    return { success: true, message: 'Successfully joined challenge' };
  } catch (error) {
    logger.error('Error joining challenge:', error);
    return { success: false, message: 'Error joining challenge' };
  }
};

/**
 * Update participant progress
 */
export const updateParticipantProgress = async (
  challengeId: string,
  userId: string
): Promise<boolean> => {
  try {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge || challenge.status !== 'active') {
      return false;
    }

    const participant = await ChallengeParticipant.findOne({
      challenge: challengeId,
      user: userId,
    });

    if (!participant || participant.isCompleted) {
      return false;
    }

    let newCurrentValue = 0;

    switch (challenge.type) {
      case 'complete_courses':
        const completedCourses = await Submission.find({
          user: userId,
          status: 'graded',
          gradedAt: { $gte: challenge.startDate },
        }).distinct('course');
        newCurrentValue = completedCourses.length;
        break;

      case 'earn_xp':
        // Calculate XP earned since challenge start
        const UserXP = (await import('../models/UserXP')).default;
        const xpEarned = await UserXP.aggregate([
          {
            $match: {
              user: userId,
              createdAt: { $gte: challenge.startDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);
        newCurrentValue = xpEarned[0]?.total || 0;
        break;

      case 'reach_level':
        const user = await User.findById(userId).select('level');
        const userLevel = user?.level || 1;
        // For level challenges, we track the level reached
        newCurrentValue = userLevel;
        break;

      case 'complete_assignments':
        newCurrentValue = await Submission.countDocuments({
          user: userId,
          status: 'graded',
          gradedAt: { $gte: challenge.startDate },
        });
        break;

      case 'share_projects':
        newCurrentValue = await Project.countDocuments({
          user: userId,
          isPublic: true,
          createdAt: { $gte: challenge.startDate },
        });
        break;

      case 'social_engagement':
        // Count posts, comments, likes received during challenge
        const posts = await Post.countDocuments({
          user: userId,
          createdAt: { $gte: challenge.startDate },
        });
        const comments = await Comment.countDocuments({
          user: userId,
          createdAt: { $gte: challenge.startDate },
        });
        const userPosts = await Post.find({ user: userId, createdAt: { $gte: challenge.startDate } });
        const likesReceived = userPosts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
        newCurrentValue = posts + comments + likesReceived;
        break;

      case 'custom':
        // Custom challenges would need custom logic
        break;
    }

    // Calculate progress percentage
    const progressPercentage = challenge.targetValue > 0
      ? Math.min(100, Math.round((newCurrentValue / challenge.targetValue) * 100))
      : 0;

    // Check if challenge is completed
    if (newCurrentValue >= challenge.targetValue && !participant.isCompleted) {
      participant.isCompleted = true;
      participant.completedAt = new Date();
      participant.currentValue = newCurrentValue;
      participant.progressPercentage = 100;

      // Award rewards
      if (challenge.xpReward && challenge.xpReward > 0 && !participant.rewardsClaimed.xp) {
        await awardXP({
          userId,
          amount: challenge.xpReward,
          source: 'challenge_completed',
          sourceId: challengeId,
          description: `Challenge completed: ${challenge.title}`,
        });
        participant.rewardsClaimed.xp = true;
      }

      // TODO: Award badge/achievement rewards if set

      logger.info(`User ${userId} completed challenge ${challengeId}`);
    } else {
      participant.currentValue = newCurrentValue;
      participant.progressPercentage = progressPercentage;
    }

    await participant.save();

    // Update rankings
    await updateChallengeRankings(challengeId);

    return true;
  } catch (error) {
    logger.error('Error updating participant progress:', error);
    return false;
  }
};

/**
 * Update challenge rankings
 */
const updateChallengeRankings = async (challengeId: string): Promise<void> => {
  try {
    const participants = await ChallengeParticipant.find({
      challenge: challengeId,
    })
      .sort({ currentValue: -1, completedAt: 1 })
      .select('_id');

    // Update ranks
    for (let i = 0; i < participants.length; i++) {
      await ChallengeParticipant.findByIdAndUpdate(participants[i]._id, {
        rank: i + 1,
      });
    }
  } catch (error) {
    logger.error('Error updating challenge rankings:', error);
  }
};

/**
 * Check and update challenges based on trigger type
 */
export const checkChallengesForTrigger = async (
  userId: string,
  triggerType: string
): Promise<void> => {
  try {
    // Get active challenges that might be affected by this trigger
    const relevantChallengeTypes = getRelevantChallengeTypes(triggerType);
    
    const challenges = await Challenge.find({
      status: 'active',
      type: { $in: relevantChallengeTypes },
    });

    // Get user's active challenge participations
    const participantRecords = await ChallengeParticipant.find({
      user: userId,
      challenge: { $in: challenges.map(c => c._id) },
      isCompleted: false,
    });

    for (const participant of participantRecords) {
      await updateParticipantProgress(participant.challenge.toString(), userId);
    }
  } catch (error) {
    logger.error('Error checking challenges for trigger:', error);
  }
};

/**
 * Get relevant challenge types based on trigger type
 */
const getRelevantChallengeTypes = (triggerType: string): string[] => {
  const mapping: { [key: string]: string[] } = {
    course_completed: ['complete_courses'],
    assignment_submitted: ['complete_assignments'],
    quiz_passed: ['complete_assignments'],
    xp_earned: ['earn_xp'],
    level_up: ['reach_level'],
    project_shared: ['share_projects'],
    post_created: ['social_engagement'],
    like_received: ['social_engagement'],
  };

  return mapping[triggerType] || [];
};

/**
 * Update challenge status based on dates
 */
export const updateChallengeStatuses = async (): Promise<void> => {
  try {
    const now = new Date();

    // Activate challenges
    await Challenge.updateMany(
      {
        status: 'upcoming',
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      {
        status: 'active',
      }
    );

    // End challenges
    await Challenge.updateMany(
      {
        status: 'active',
        endDate: { $lt: now },
      },
      {
        status: 'ended',
      }
    );
  } catch (error) {
    logger.error('Error updating challenge statuses:', error);
  }
};

/**
 * Get challenge leaderboard
 */
export const getChallengeLeaderboard = async (
  challengeId: string,
  limit: number = 10
): Promise<any[]> => {
  try {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge || !challenge.showLeaderboard) {
      return [];
    }

    const query: any = { challenge: challengeId };
    const sortOptions: any = { currentValue: -1, completedAt: 1 };

    let participants;
    if (challenge.leaderboardType === 'all') {
      participants = await ChallengeParticipant.find(query)
        .populate('user', 'username profilePhoto level xp')
        .sort(sortOptions);
    } else {
      participants = await ChallengeParticipant.find(query)
        .populate('user', 'username profilePhoto level xp')
        .sort(sortOptions)
        .limit(limit);
    }

    return participants;
  } catch (error) {
    logger.error('Error getting challenge leaderboard:', error);
    return [];
  }
};


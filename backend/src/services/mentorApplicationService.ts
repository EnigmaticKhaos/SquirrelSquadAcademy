import MentorApplication, { ApplicationStatus, ReviewPriority } from '../models/MentorApplication';
import User from '../models/User';
import CourseCompletion from '../models/CourseCompletion';
import CourseReview from '../models/CourseReview';
import UserWarning from '../models/UserWarning';
import Mentorship from '../models/Mentorship';
import { createNotification } from './notificationService';
import logger from '../utils/logger';

// Auto-approval criteria thresholds
const AUTO_APPROVE_CRITERIA = {
  minLevel: 10,
  minCoursesCompleted: 5,
  minAverageRating: 4.5,
  maxWarnings: 0,
  minAccountAgeDays: 30,
};

// Auto-reject criteria
const AUTO_REJECT_CRITERIA = {
  isBanned: true,
  isSuspended: true,
  warningCount: 3, // 3 or more warnings
  minLevel: 1, // Must be at least level 1
};

/**
 * Calculate auto-evaluation metrics for a user
 */
const calculateAutoEvaluation = async (userId: string): Promise<{
  level: number;
  coursesCompleted: number;
  averageRating: number;
  warningCount: number;
  accountAge: number;
  meetsAutoApproveCriteria: boolean;
  meetsAutoRejectCriteria: boolean;
}> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const coursesCompleted = await CourseCompletion.countDocuments({ user: userId });
  const reviews = await CourseReview.find({ user: userId });
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const warnings = await UserWarning.countDocuments({
    user: userId,
    isActive: true,
  });

  const accountAge = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check auto-approve criteria
  const meetsAutoApproveCriteria =
    user.level >= AUTO_APPROVE_CRITERIA.minLevel &&
    coursesCompleted >= AUTO_APPROVE_CRITERIA.minCoursesCompleted &&
    averageRating >= AUTO_APPROVE_CRITERIA.minAverageRating &&
    warnings <= AUTO_APPROVE_CRITERIA.maxWarnings &&
    accountAge >= AUTO_APPROVE_CRITERIA.minAccountAgeDays &&
    !user.moderationStatus?.isBanned &&
    !user.moderationStatus?.isSuspended;

  // Check auto-reject criteria
  const meetsAutoRejectCriteria =
    user.moderationStatus?.isBanned === true ||
    user.moderationStatus?.isSuspended === true ||
    warnings >= AUTO_REJECT_CRITERIA.warningCount ||
    user.level < AUTO_REJECT_CRITERIA.minLevel;

  return {
    level: user.level,
    coursesCompleted,
    averageRating,
    warningCount: warnings,
    accountAge,
    meetsAutoApproveCriteria,
    meetsAutoRejectCriteria,
  };
};

/**
 * Get AI recommendation for application
 */
const getAIRecommendation = async (
  userId: string,
  applicationData: {
    motivation: string;
    specialties: string[];
    experience?: string;
  }
): Promise<{ recommendation: 'approve' | 'review' | 'reject'; reason: string }> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { recommendation: 'review', reason: 'User not found' };
    }

    const autoEval = await calculateAutoEvaluation(userId);

    // Use AI to analyze motivation and experience
    const moderationService = await import('./ai/moderationService');
    const moderationResult = await moderationService.moderateContent(
      `${applicationData.motivation} ${applicationData.experience || ''}`
    );

    // If content is flagged, recommend rejection
    if (moderationResult.isFlagged && moderationResult.severity === 'high') {
      return {
        recommendation: 'reject',
        reason: 'Application content flagged by AI moderation',
      };
    }

    // If meets auto-approve criteria, recommend approve
    if (autoEval.meetsAutoApproveCriteria) {
      return {
        recommendation: 'approve',
        reason: 'Meets all auto-approval criteria',
      };
    }

    // If meets auto-reject criteria, recommend reject
    if (autoEval.meetsAutoRejectCriteria) {
      return {
        recommendation: 'reject',
        reason: 'Does not meet minimum requirements or has account issues',
      };
    }

    // Otherwise, recommend review
    return {
      recommendation: 'review',
      reason: 'Requires manual review',
    };
  } catch (error) {
    logger.error('Error getting AI recommendation:', error);
    return { recommendation: 'review', reason: 'Error in AI evaluation' };
  }
};

/**
 * Submit mentor application
 */
export const submitMentorApplication = async (
  userId: string,
  data: {
    motivation: string;
    specialties: string[];
    experience?: string;
    availability?: {
      hoursPerWeek?: number;
      timezone?: string;
      preferredTimes?: string[];
    };
    maxMentees?: number;
  }
): Promise<MentorApplication> => {
  try {
    // Check if user already has an application
    const existingApplication = await MentorApplication.findOne({ user: userId });
    if (existingApplication) {
      if (existingApplication.status === 'pending') {
        throw new Error('You already have a pending application');
      }
      if (existingApplication.status === 'approved') {
        throw new Error('You are already an approved mentor');
      }
    }

    // Check if user is already a mentor
    const user = await User.findById(userId);
    if (user?.mentorStatus?.isMentor) {
      throw new Error('You are already a mentor');
    }

    // Calculate auto-evaluation
    const autoEval = await calculateAutoEvaluation(userId);

    // Get AI recommendation
    const aiRec = await getAIRecommendation(userId, {
      motivation: data.motivation,
      specialties: data.specialties,
      experience: data.experience,
    });

    // Determine priority
    let priority: ReviewPriority = 'review';
    if (autoEval.meetsAutoApproveCriteria && aiRec.recommendation === 'approve') {
      priority = 'auto_approve';
    } else if (autoEval.meetsAutoRejectCriteria || aiRec.recommendation === 'reject') {
      priority = 'auto_reject';
    }

    // Create application
    const application = await MentorApplication.create({
      user: userId,
      status: 'pending',
      priority,
      motivation: data.motivation,
      specialties: data.specialties,
      experience: data.experience,
      availability: data.availability,
      maxMentees: data.maxMentees || 5,
      autoEvaluation: {
        ...autoEval,
        aiRecommendation: aiRec.recommendation,
        aiReason: aiRec.reason,
      },
    });

    // Auto-approve if meets criteria
    if (priority === 'auto_approve') {
      await approveMentorApplication(application._id.toString(), 'system' as any, {
        autoApproved: true,
      });
    } else if (priority === 'auto_reject') {
      // Auto-reject with reason
      await rejectMentorApplication(application._id.toString(), 'system' as any, {
        reason: aiRec.reason || 'Does not meet minimum requirements',
        autoRejected: true,
      });
    } else {
      // Notify admins of pending application
      await notifyAdminsOfApplication(application);
    }

    logger.info(`Mentor application submitted: ${application._id} by user ${userId}`);
    return application;
  } catch (error) {
    logger.error('Error submitting mentor application:', error);
    throw error;
  }
};

/**
 * Approve mentor application
 */
export const approveMentorApplication = async (
  applicationId: string,
  adminId: string,
  options?: {
    autoApproved?: boolean;
    notes?: string;
  }
): Promise<void> => {
  try {
    const application = await MentorApplication.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'pending') {
      throw new Error('Application has already been processed');
    }

    const user = await User.findById(application.user);
    if (!user) {
      throw new Error('User not found');
    }

    // Update application
    application.status = 'approved';
    application.reviewedBy = adminId as any;
    application.reviewedAt = new Date();
    if (options?.notes) {
      application.reviewNotes = options.notes;
    }
    await application.save();

    // Update user mentor status
    user.mentorStatus = {
      isMentor: true,
      isAvailable: true,
      maxMentees: application.maxMentees || 5,
      specialties: application.specialties,
      mentorBio: application.motivation,
      applicationDate: application.createdAt,
      approvedDate: new Date(),
      approvedBy: options?.autoApproved ? undefined : (adminId as any),
      stats: {
        totalMentees: 0,
        activeMentorships: 0,
        completedMentorships: 0,
        averageRating: 0,
      },
    };
    await user.save();

    // Send notification to user
    await createNotification(application.user.toString(), 'system_announcement', {
      title: '🎉 Mentor Application Approved!',
      message: options?.autoApproved
        ? 'Your mentor application has been automatically approved! You can now accept mentorship requests.'
        : 'Your mentor application has been approved! You can now accept mentorship requests.',
      actionUrl: '/mentorship/mentor',
      priority: 'high',
      sendEmail: true,
    });

    // Award XP for becoming a mentor
    const { awardXP } = await import('./xpService');
    await awardXP({
      userId: application.user.toString(),
      amount: 500,
      source: 'mentor_approved',
      sourceId: application._id.toString(),
      description: 'Became a mentor',
    });

    logger.info(`Mentor application approved: ${applicationId} by ${adminId}`);
  } catch (error) {
    logger.error('Error approving mentor application:', error);
    throw error;
  }
};

/**
 * Reject mentor application
 */
export const rejectMentorApplication = async (
  applicationId: string,
  adminId: string,
  options: {
    reason: string;
    autoRejected?: boolean;
    notes?: string;
  }
): Promise<void> => {
  try {
    const application = await MentorApplication.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'pending') {
      throw new Error('Application has already been processed');
    }

    // Update application
    application.status = 'rejected';
    application.reviewedBy = adminId as any;
    application.reviewedAt = new Date();
    application.rejectionReason = options.reason;
    if (options.notes) {
      application.reviewNotes = options.notes;
    }
    await application.save();

    // Send notification to user
    await createNotification(application.user.toString(), 'system_announcement', {
      title: 'Mentor Application Update',
      message: options.autoRejected
        ? `Your mentor application was not approved. Reason: ${options.reason}`
        : `Your mentor application has been reviewed. Reason: ${options.reason}`,
      actionUrl: '/mentorship/apply',
      priority: 'normal',
      sendEmail: true,
    });

    logger.info(`Mentor application rejected: ${applicationId} by ${adminId}`);
  } catch (error) {
    logger.error('Error rejecting mentor application:', error);
    throw error;
  }
};

/**
 * Bulk approve applications
 */
export const bulkApproveApplications = async (
  applicationIds: string[],
  adminId: string
): Promise<{ approved: number; failed: number }> => {
  let approved = 0;
  let failed = 0;

  for (const applicationId of applicationIds) {
    try {
      await approveMentorApplication(applicationId, adminId);
      approved++;
    } catch (error) {
      logger.error(`Error approving application ${applicationId}:`, error);
      failed++;
    }
  }

  return { approved, failed };
};

/**
 * Bulk reject applications
 */
export const bulkRejectApplications = async (
  applicationIds: string[],
  adminId: string,
  reason: string
): Promise<{ rejected: number; failed: number }> => {
  let rejected = 0;
  let failed = 0;

  for (const applicationId of applicationIds) {
    try {
      await rejectMentorApplication(applicationId, adminId, { reason });
      rejected++;
    } catch (error) {
      logger.error(`Error rejecting application ${applicationId}:`, error);
      failed++;
    }
  }

  return { rejected, failed };
};

/**
 * Get applications for admin review
 */
export const getApplicationsForReview = async (options?: {
  status?: ApplicationStatus;
  priority?: ReviewPriority;
  limit?: number;
  offset?: number;
}): Promise<{ applications: any[]; total: number; stats: any }> => {
  try {
    const query: any = {};

    if (options?.status) {
      query.status = options.status;
    } else {
      query.status = 'pending';
    }

    if (options?.priority) {
      query.priority = options.priority;
    }

    const total = await MentorApplication.countDocuments(query);

    const applications = await MentorApplication.find(query)
      .populate('user', 'username profilePhoto level xp email createdAt')
      .populate('reviewedBy', 'username')
      .sort({ priority: 1, createdAt: -1 }) // Auto-approve first, then review, then auto-reject
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    // Get statistics
    const stats = {
      pending: await MentorApplication.countDocuments({ status: 'pending' }),
      autoApprove: await MentorApplication.countDocuments({ status: 'pending', priority: 'auto_approve' }),
      review: await MentorApplication.countDocuments({ status: 'pending', priority: 'review' }),
      autoReject: await MentorApplication.countDocuments({ status: 'pending', priority: 'auto_reject' }),
      approved: await MentorApplication.countDocuments({ status: 'approved' }),
      rejected: await MentorApplication.countDocuments({ status: 'rejected' }),
    };

    return { applications, total, stats };
  } catch (error) {
    logger.error('Error getting applications for review:', error);
    return { applications: [], total: 0, stats: {} };
  }
};

/**
 * Get user's application
 */
export const getUserApplication = async (userId: string): Promise<MentorApplication | null> => {
  try {
    return await MentorApplication.findOne({ user: userId })
      .populate('reviewedBy', 'username');
  } catch (error) {
    logger.error('Error getting user application:', error);
    return null;
  }
};

/**
 * Update mentor availability
 */
export const updateMentorAvailability = async (
  userId: string,
  isAvailable: boolean
): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.mentorStatus?.isMentor) {
      throw new Error('User is not a mentor');
    }

    user.mentorStatus.isAvailable = isAvailable;
    await user.save();

    logger.info(`Mentor availability updated: ${userId}, available: ${isAvailable}`);
  } catch (error) {
    logger.error('Error updating mentor availability:', error);
    throw error;
  }
};

/**
 * Update mentor stats
 */
export const updateMentorStats = async (mentorId: string): Promise<void> => {
  try {
    const user = await User.findById(mentorId);
    if (!user || !user.mentorStatus?.isMentor) {
      return;
    }

    const activeMentorships = await Mentorship.countDocuments({
      mentor: mentorId,
      status: 'active',
    });

    const completedMentorships = await Mentorship.countDocuments({
      mentor: mentorId,
      status: 'completed',
    });

    const mentorships = await Mentorship.find({
      mentor: mentorId,
      status: 'completed',
      mentorRating: { $exists: true, $ne: null },
    });

    const averageRating = mentorships.length > 0
      ? mentorships.reduce((sum, m) => sum + (m.mentorRating || 0), 0) / mentorships.length
      : 0;

    const uniqueMentees = await Mentorship.distinct('mentee', {
      mentor: mentorId,
    });

    if (!user.mentorStatus.stats) {
      user.mentorStatus.stats = {
        totalMentees: 0,
        activeMentorships: 0,
        completedMentorships: 0,
        averageRating: 0,
      };
    }

    user.mentorStatus.stats.totalMentees = uniqueMentees.length;
    user.mentorStatus.stats.activeMentorships = activeMentorships;
    user.mentorStatus.stats.completedMentorships = completedMentorships;
    user.mentorStatus.stats.averageRating = averageRating;

    await user.save();
  } catch (error) {
    logger.error('Error updating mentor stats:', error);
  }
};

/**
 * Notify admins of new application
 */
const notifyAdminsOfApplication = async (application: MentorApplication): Promise<void> => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await createNotification(admin._id.toString(), 'system_announcement', {
        title: 'New Mentor Application',
        message: `A new mentor application requires review (Priority: ${application.priority})`,
        actionUrl: `/admin/mentor-applications/${application._id}`,
        priority: application.priority === 'auto_reject' ? 'low' : 'normal',
      }).catch((error) => {
        logger.error('Error sending notification:', error);
      });
    }
  } catch (error) {
    logger.error('Error notifying admins:', error);
  }
};


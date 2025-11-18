import ContentReport, { ReportType, ReportReason, ReportStatus } from '../models/ContentReport';
import UserWarning, { WarningType, WarningSeverity } from '../models/UserWarning';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Message from '../models/Message';
import ForumPost from '../models/ForumPost';
import Project from '../models/Project';
import { moderateContent } from './ai/moderationService';
import { createNotification } from './notificationService';
import logger from '../utils/logger';

/**
 * Create a content report
 */
export const createReport = async (
  reporterId: string,
  data: {
    contentType: ReportType;
    contentId: string;
    reason: ReportReason;
    description?: string;
    evidence?: string[];
  }
): Promise<ContentReport> => {
  try {
    // Check if user already reported this content
    const existingReport = await ContentReport.findOne({
      reporter: reporterId,
      contentType: data.contentType,
      contentId: data.contentId,
      status: { $in: ['pending', 'reviewing'] },
    });

    if (existingReport) {
      throw new Error('You have already reported this content');
    }

    // Get the content to check if it exists and get the author
    const content = await getContentById(data.contentType, data.contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Run AI moderation on the content
    let aiModerationResult;
    if (data.contentType !== 'user') {
      const contentText = extractTextFromContent(data.contentType, content);
      if (contentText) {
        aiModerationResult = await moderateContent(contentText);
      }
    }

    // Determine priority based on AI moderation and reason
    let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
    if (aiModerationResult?.severity === 'high' || data.reason === 'violence' || data.reason === 'self_harm') {
      priority = 'urgent';
    } else if (aiModerationResult?.severity === 'medium' || data.reason === 'harassment' || data.reason === 'hate_speech') {
      priority = 'high';
    }

    // Create report
    const report = await ContentReport.create({
      reporter: reporterId,
      contentType: data.contentType,
      contentId: data.contentId,
      reason: data.reason,
      description: data.description,
      evidence: data.evidence,
      priority,
      aiModerationResult,
    });

    // Auto-warn if AI detected high severity
    if (aiModerationResult?.severity === 'high' && data.contentType !== 'user') {
      const authorId = getAuthorIdFromContent(data.contentType, content);
      if (authorId) {
        await autoWarnUser(authorId, {
          type: 'content_violation',
          severity: 'high',
          reason: 'Automated warning: High severity content violation detected',
          description: `Your ${data.contentType} was automatically flagged for violating community guidelines.`,
          relatedReport: report._id.toString(),
          relatedContent: {
            type: data.contentType,
            id: data.contentId,
          },
        });
      }
    }

    // Notify admins of urgent reports
    if (priority === 'urgent') {
      await notifyAdminsOfReport(report);
    }

    logger.info(`Content report created: ${report._id} by user ${reporterId}`);
    return report;
  } catch (error) {
    logger.error('Error creating content report:', error);
    throw error;
  }
};

/**
 * Review and resolve a report
 */
export const reviewReport = async (
  reportId: string,
  moderatorId: string,
  action: {
    status: ReportStatus;
    actionType?: 'warning' | 'content_removed' | 'user_warned' | 'user_suspended' | 'user_banned' | 'no_action';
    actionDetails?: string;
    moderationNotes?: string;
  }
): Promise<ContentReport> => {
  try {
    const report = await ContentReport.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    report.status = action.status;
    report.reviewedBy = moderatorId as any;
    report.reviewedAt = new Date();
    report.moderationNotes = action.moderationNotes;

    if (action.actionType) {
      report.actionTaken = {
        type: action.actionType,
        details: action.actionDetails,
      };

      // Execute the action
      if (action.actionType === 'user_warned' || action.actionType === 'warning') {
        const authorId = await getAuthorIdFromReport(report);
        if (authorId) {
          const warning = await issueWarning(authorId, moderatorId, {
            type: 'content_violation',
            severity: 'medium',
            reason: action.actionDetails || 'Content violation',
            description: action.moderationNotes || 'Your content violated community guidelines',
            relatedReport: reportId,
            relatedContent: {
              type: report.contentType,
              id: report.contentId.toString(),
            },
          });
          report.actionTaken.warningId = warning._id;
        }
      } else if (action.actionType === 'user_suspended') {
        const authorId = await getAuthorIdFromReport(report);
        if (authorId) {
          await suspendUser(authorId, {
            reason: action.actionDetails || 'Content violation',
            duration: 7, // 7 days default
            moderatorId,
          });
        }
      } else if (action.actionType === 'user_banned') {
        const authorId = await getAuthorIdFromReport(report);
        if (authorId) {
          await banUser(authorId, {
            reason: action.actionDetails || 'Severe content violation',
            moderatorId,
          });
        }
      } else if (action.actionType === 'content_removed') {
        await removeContent(report.contentType, report.contentId.toString());
      }
    }

    await report.save();

    logger.info(`Report reviewed: ${reportId} by moderator ${moderatorId}`);
    return report;
  } catch (error) {
    logger.error('Error reviewing report:', error);
    throw error;
  }
};

/**
 * Issue a warning to a user
 */
export const issueWarning = async (
  userId: string,
  moderatorId: string,
  data: {
    type: WarningType;
    severity: WarningSeverity;
    reason: string;
    description: string;
    relatedReport?: string;
    relatedContent?: {
      type: string;
      id: string;
    };
    expiresInDays?: number;
  }
): Promise<UserWarning> => {
  try {
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const warning = await UserWarning.create({
      user: userId,
      type: data.type,
      severity: data.severity,
      reason: data.reason,
      description: data.description,
      relatedReport: data.relatedReport as any,
      relatedContent: data.relatedContent as any,
      issuedBy: moderatorId,
      expiresAt,
      isActive: true,
    });

    // Update user warning count
    await User.findByIdAndUpdate(userId, {
      $inc: { 'moderationStatus.warningCount': 1 },
      $set: { 'moderationStatus.lastWarningAt': new Date() },
    });

    // Send notification to user
    await createNotification(userId, 'system_announcement', {
      title: '⚠️ Warning Issued',
      message: `You have received a warning: ${data.reason}`,
      actionUrl: `/profile/warnings`,
      priority: 'high',
      sendEmail: true,
    });

    logger.info(`Warning issued to user ${userId} by moderator ${moderatorId}`);
    return warning;
  } catch (error) {
    logger.error('Error issuing warning:', error);
    throw error;
  }
};

/**
 * Auto-warn user (automated)
 */
const autoWarnUser = async (
  userId: string,
  data: {
    type: WarningType;
    severity: WarningSeverity;
    reason: string;
    description: string;
    relatedReport?: string;
    relatedContent?: {
      type: string;
      id: string;
    };
  }
): Promise<void> => {
  try {
    await issueWarning(userId, 'system' as any, {
      ...data,
      expiresInDays: 30,
    });
  } catch (error) {
    logger.error('Error auto-warning user:', error);
  }
};

/**
 * Suspend user
 */
export const suspendUser = async (
  userId: string,
  options: {
    reason: string;
    duration: number; // days
    moderatorId: string;
  }
): Promise<void> => {
  try {
    const suspendedUntil = new Date(Date.now() + options.duration * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(userId, {
      $set: {
        'moderationStatus.isSuspended': true,
        'moderationStatus.suspensionReason': options.reason,
        'moderationStatus.suspendedUntil': suspendedUntil,
      },
    });

    // Send notification
    await createNotification(userId, 'system_announcement', {
      title: '🚫 Account Suspended',
      message: `Your account has been suspended until ${suspendedUntil.toLocaleDateString()}. Reason: ${options.reason}`,
      actionUrl: `/profile`,
      priority: 'urgent',
      sendEmail: true,
    });

    logger.info(`User ${userId} suspended by moderator ${options.moderatorId}`);
  } catch (error) {
    logger.error('Error suspending user:', error);
    throw error;
  }
};

/**
 * Ban user
 */
export const banUser = async (
  userId: string,
  options: {
    reason: string;
    moderatorId: string;
    bannedUntil?: Date;
  }
): Promise<void> => {
  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        'moderationStatus.isBanned': true,
        'moderationStatus.banReason': options.reason,
        'moderationStatus.bannedUntil': options.bannedUntil,
      },
    });

    // Send notification
    await createNotification(userId, 'system_announcement', {
      title: '🚫 Account Banned',
      message: `Your account has been banned. Reason: ${options.reason}`,
      actionUrl: `/profile`,
      priority: 'urgent',
      sendEmail: true,
    });

    logger.info(`User ${userId} banned by moderator ${options.moderatorId}`);
  } catch (error) {
    logger.error('Error banning user:', error);
    throw error;
  }
};

/**
 * Unban user
 */
export const unbanUser = async (userId: string, moderatorId: string): Promise<void> => {
  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        'moderationStatus.isBanned': false,
        'moderationStatus.banReason': undefined,
        'moderationStatus.bannedUntil': undefined,
      },
    });

    logger.info(`User ${userId} unbanned by moderator ${moderatorId}`);
  } catch (error) {
    logger.error('Error unbanning user:', error);
    throw error;
  }
};

/**
 * Get reports for moderation dashboard
 */
export const getReports = async (options?: {
  status?: ReportStatus;
  priority?: string;
  contentType?: ReportType;
  limit?: number;
  offset?: number;
}): Promise<{ reports: ContentReport[]; total: number }> => {
  try {
    const query: any = {};

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.priority) {
      query.priority = options.priority;
    }

    if (options?.contentType) {
      query.contentType = options.contentType;
    }

    const total = await ContentReport.countDocuments(query);

    const reports = await ContentReport.find(query)
      .populate('reporter', 'username profilePhoto')
      .populate('reviewedBy', 'username profilePhoto')
      .sort({ priority: -1, createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { reports, total };
  } catch (error) {
    logger.error('Error getting reports:', error);
    return { reports: [], total: 0 };
  }
};

/**
 * Get user warnings
 */
export const getUserWarnings = async (
  userId: string,
  includeExpired: boolean = false
): Promise<UserWarning[]> => {
  try {
    const query: any = { user: userId };

    if (!includeExpired) {
      query.isActive = true;
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ];
    }

    return await UserWarning.find(query)
      .populate('issuedBy', 'username profilePhoto')
      .populate('relatedReport')
      .sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Error getting user warnings:', error);
    return [];
  }
};

// Helper functions
const getContentById = async (contentType: ReportType, contentId: string): Promise<any> => {
  switch (contentType) {
    case 'post':
      return await Post.findById(contentId);
    case 'comment':
      return await Comment.findById(contentId);
    case 'message':
      return await Message.findById(contentId);
    case 'forum_post':
      return await ForumPost.findById(contentId);
    case 'project':
      return await Project.findById(contentId);
    case 'user':
      return await User.findById(contentId);
    default:
      return null;
  }
};

const extractTextFromContent = (contentType: ReportType, content: any): string | null => {
  switch (contentType) {
    case 'post':
    case 'comment':
    case 'message':
    case 'forum_post':
      return content?.content || null;
    case 'project':
      return content?.description || content?.title || null;
    case 'user':
      return content?.bio || null;
    default:
      return null;
  }
};

const getAuthorIdFromContent = (contentType: ReportType, content: any): string | null => {
  switch (contentType) {
    case 'post':
    case 'comment':
    case 'project':
      return content?.user?.toString() || null;
    case 'message':
      return content?.sender?.toString() || null;
    case 'forum_post':
      return content?.author?.toString() || null;
    default:
      return null;
  }
};

const getAuthorIdFromReport = async (report: ContentReport): Promise<string | null> => {
  const content = await getContentById(report.contentType, report.contentId.toString());
  return getAuthorIdFromContent(report.contentType, content);
};

const removeContent = async (contentType: ReportType, contentId: string): Promise<void> => {
  switch (contentType) {
    case 'post':
      await Post.findByIdAndDelete(contentId);
      break;
    case 'comment':
      await Comment.findByIdAndDelete(contentId);
      break;
    case 'message':
      await Message.findByIdAndDelete(contentId);
      break;
    case 'forum_post':
      await ForumPost.findByIdAndDelete(contentId);
      break;
    case 'project':
      await Project.findByIdAndDelete(contentId);
      break;
  }
};

const notifyAdminsOfReport = async (report: ContentReport): Promise<void> => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await createNotification(admin._id.toString(), 'system_announcement', {
        title: '🚨 Urgent Report Requires Review',
        message: `A ${report.priority} priority report has been submitted and requires immediate review.`,
        actionUrl: `/admin/moderation/reports/${report._id}`,
        priority: 'urgent',
        sendEmail: true,
      });
    }
  } catch (error) {
    logger.error('Error notifying admins:', error);
  }
};

/**
 * Check if user is banned or suspended
 */
export const checkUserModerationStatus = async (userId: string): Promise<{
  canAccess: boolean;
  reason?: string;
  until?: Date;
}> => {
  try {
    const user = await User.findById(userId).select('moderationStatus');
    if (!user || !user.moderationStatus) {
      return { canAccess: true };
    }

    const status = user.moderationStatus;

    // Check if banned
    if (status.isBanned) {
      if (status.bannedUntil && status.bannedUntil > new Date()) {
        return {
          canAccess: false,
          reason: status.banReason || 'Account banned',
          until: status.bannedUntil,
        };
      } else if (!status.bannedUntil) {
        // Permanent ban
        return {
          canAccess: false,
          reason: status.banReason || 'Account permanently banned',
        };
      } else {
        // Ban expired, unban
        await User.findByIdAndUpdate(userId, {
          $set: {
            'moderationStatus.isBanned': false,
            'moderationStatus.banReason': undefined,
            'moderationStatus.bannedUntil': undefined,
          },
        });
      }
    }

    // Check if suspended
    if (status.isSuspended) {
      if (status.suspendedUntil && status.suspendedUntil > new Date()) {
        return {
          canAccess: false,
          reason: status.suspensionReason || 'Account suspended',
          until: status.suspendedUntil,
        };
      } else if (status.suspendedUntil) {
        // Suspension expired, unsuspend
        await User.findByIdAndUpdate(userId, {
          $set: {
            'moderationStatus.isSuspended': false,
            'moderationStatus.suspensionReason': undefined,
            'moderationStatus.suspendedUntil': undefined,
          },
        });
      }
    }

    return { canAccess: true };
  } catch (error) {
    logger.error('Error checking user moderation status:', error);
    return { canAccess: true }; // Default to allowing access on error
  }
};


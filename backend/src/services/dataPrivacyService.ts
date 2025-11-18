import User from '../models/User';
import DataExport from '../models/DataExport';
import CookieConsent from '../models/CookieConsent';
import CourseEnrollment from '../models/CourseEnrollment';
import CourseCompletion from '../models/CourseCompletion';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Like from '../models/Like';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import Note from '../models/Note';
import Project from '../models/Project';
import Submission from '../models/Submission';
import VideoProgress from '../models/VideoProgress';
import Notification from '../models/Notification';
import UserAchievement from '../models/UserAchievement';
import UserBadge from '../models/UserBadge';
import LearningSession from '../models/LearningSession';
import LearningStreak from '../models/LearningStreak';
import LearningGoal from '../models/LearningGoal';
import FlashcardDeck from '../models/FlashcardDeck';
import Flashcard from '../models/Flashcard';
import PomodoroSession from '../models/PomodoroSession';
import StudyReminder from '../models/StudyReminder';
import SavedContent from '../models/SavedContent';
import CourseReview from '../models/CourseReview';
import CourseWaitlist from '../models/CourseWaitlist';
import CourseWishlist from '../models/CourseWishlist';
import PushSubscription from '../models/PushSubscription';
import OfflineSyncQueue from '../models/OfflineSyncQueue';
import Mentorship from '../models/Mentorship';
import MentorApplication from '../models/MentorApplication';
import CollaborativeProject from '../models/CollaborativeProject';
import { deleteImage } from './cloudinaryService';
import { deleteFile } from './s3Service';
import logger from '../utils/logger';

/**
 * Export user data
 */
export const exportUserData = async (
  userId: string,
  options: {
    format?: 'json' | 'csv' | 'pdf';
    includeProfile?: boolean;
    includeCourses?: boolean;
    includeSocial?: boolean;
    includeAnalytics?: boolean;
    includeMessages?: boolean;
    includeProjects?: boolean;
  } = {}
): Promise<any> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Create export record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

    const dataExport = await DataExport.create({
      user: userId,
      status: 'processing',
      format: options.format || 'json',
      expiresAt,
      includeProfile: options.includeProfile !== false,
      includeCourses: options.includeCourses !== false,
      includeSocial: options.includeSocial !== false,
      includeAnalytics: options.includeAnalytics !== false,
      includeMessages: options.includeMessages !== false,
      includeProjects: options.includeProjects !== false,
    });

    // Collect user data
    const userData: any = {};

    if (options.includeProfile !== false) {
      userData.profile = {
        email: user.email,
        username: user.username,
        bio: user.bio,
        socialLinks: user.socialLinks,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }

    if (options.includeCourses !== false) {
      const enrollments = await CourseEnrollment.find({ user: userId })
        .populate('course', 'title description')
        .lean();
      const completions = await CourseCompletion.find({ user: userId })
        .populate('course', 'title')
        .lean();
      const reviews = await CourseReview.find({ user: userId })
        .populate('course', 'title')
        .lean();
      const waitlist = await CourseWaitlist.find({ user: userId })
        .populate('course', 'title')
        .lean();
      const wishlist = await CourseWishlist.find({ user: userId })
        .populate('course', 'title')
        .lean();

      userData.courses = {
        enrollments,
        completions,
        reviews,
        waitlist,
        wishlist,
      };
    }

    if (options.includeSocial !== false) {
      const posts = await Post.find({ author: userId }).lean();
      const comments = await Comment.find({ author: userId }).lean();
      const likes = await Like.find({ user: userId }).lean();

      userData.social = {
        posts,
        comments,
        likes,
      };
    }

    if (options.includeAnalytics !== false) {
      const sessions = await LearningSession.find({ user: userId }).lean();
      const streaks = await LearningStreak.find({ user: userId }).lean();
      const goals = await LearningGoal.find({ user: userId }).lean();
      const achievements = await UserAchievement.find({ user: userId })
        .populate('achievement')
        .lean();
      const badges = await UserBadge.find({ user: userId })
        .populate('badge')
        .lean();

      userData.analytics = {
        sessions,
        streaks,
        goals,
        achievements,
        badges,
        xp: user.xp,
        level: user.level,
      };
    }

    if (options.includeMessages !== false) {
      const conversations = await Conversation.find({ participants: userId })
        .populate('participants', 'username')
        .lean();
      const messages = await Message.find({ sender: userId }).lean();

      userData.messages = {
        conversations,
        messages,
      };
    }

    if (options.includeProjects !== false) {
      const projects = await Project.find({ user: userId }).lean();
      const collaborativeProjects = await CollaborativeProject.find({
        members: userId,
      }).lean();

      userData.projects = {
        personal: projects,
        collaborative: collaborativeProjects,
      };
    }

    // Additional data
    userData.notes = await Note.find({ user: userId }).lean();
    userData.submissions = await Submission.find({ user: userId })
      .populate('assignment', 'title')
      .lean();
    userData.videoProgress = await VideoProgress.find({ user: userId })
      .populate('lesson', 'title')
      .lean();
    userData.notifications = await Notification.find({ user: userId }).lean();
    userData.flashcardDecks = await FlashcardDeck.find({ user: userId }).lean();
    userData.pomodoroSessions = await PomodoroSession.find({ user: userId }).lean();
    userData.studyReminders = await StudyReminder.find({ user: userId }).lean();
    userData.savedContent = await SavedContent.find({ user: userId }).lean();
    userData.mentorships = await Mentorship.find({
      $or: [{ mentor: userId }, { mentee: userId }],
    }).lean();
    userData.mentorApplication = await MentorApplication.findOne({ user: userId }).lean();

    // Save export file to S3
    const exportData = JSON.stringify(userData, null, 2);
    const fileName = `user-data-export-${userId}-${Date.now()}.json`;
    
    // Upload to S3 (implementation depends on your S3 service)
    // For now, we'll store the data in the export record
    // In production, upload to S3 and store the URL

    dataExport.status = 'completed';
    dataExport.completedAt = new Date();
    dataExport.fileName = fileName;
    // dataExport.fileUrl = s3Url; // Set when S3 upload is implemented
    dataExport.fileSize = Buffer.byteLength(exportData, 'utf8');
    await dataExport.save();

    logger.info(`Data export completed for user ${userId}`);
    return { dataExport, data: userData };
  } catch (error) {
    logger.error('Error exporting user data:', error);
    throw error;
  }
};

/**
 * Delete user account and all associated data (Right to be Forgotten)
 */
export const deleteUserAccount = async (userId: string): Promise<void> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Delete profile images
    if (user.profilePhoto) {
      try {
        await deleteImage(user.profilePhoto);
      } catch (error) {
        logger.warn('Error deleting profile photo:', error);
      }
    }
    if (user.backgroundImage) {
      try {
        await deleteImage(user.backgroundImage);
      } catch (error) {
        logger.warn('Error deleting background image:', error);
      }
    }

    // Delete user's posts (or anonymize)
    await Post.deleteMany({ author: userId });

    // Delete user's comments (or anonymize)
    await Comment.deleteMany({ author: userId });

    // Delete user's likes
    await Like.deleteMany({ user: userId });

    // Delete user's messages and conversations
    await Message.deleteMany({ sender: userId });
    await Conversation.deleteMany({ participants: userId });

    // Delete user's notes
    await Note.deleteMany({ user: userId });

    // Delete user's projects
    const projects = await Project.find({ user: userId });
    for (const project of projects) {
      if (project.files && project.files.length > 0) {
        for (const file of project.files) {
          try {
            await deleteFile(file.url);
          } catch (error) {
            logger.warn('Error deleting project file:', error);
          }
        }
      }
    }
    await Project.deleteMany({ user: userId });

    // Remove from collaborative projects
    await CollaborativeProject.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );

    // Delete submissions
    await Submission.deleteMany({ user: userId });

    // Delete video progress
    await VideoProgress.deleteMany({ user: userId });

    // Delete notifications
    await Notification.deleteMany({ user: userId });

    // Delete achievements and badges
    await UserAchievement.deleteMany({ user: userId });
    await UserBadge.deleteMany({ user: userId });

    // Delete learning data
    await LearningSession.deleteMany({ user: userId });
    await LearningStreak.deleteMany({ user: userId });
    await LearningGoal.deleteMany({ user: userId });

    // Delete flashcards
    const decks = await FlashcardDeck.find({ user: userId });
    for (const deck of decks) {
      await Flashcard.deleteMany({ deck: deck._id });
    }
    await FlashcardDeck.deleteMany({ user: userId });

    // Delete study tools
    await PomodoroSession.deleteMany({ user: userId });
    await StudyReminder.deleteMany({ user: userId });

    // Delete saved content
    await SavedContent.deleteMany({ user: userId });

    // Delete course-related data
    await CourseEnrollment.deleteMany({ user: userId });
    await CourseCompletion.deleteMany({ user: userId });
    await CourseReview.deleteMany({ user: userId });
    await CourseWaitlist.deleteMany({ user: userId });
    await CourseWishlist.deleteMany({ user: userId });

    // Delete push subscriptions
    await PushSubscription.deleteMany({ user: userId });

    // Delete offline sync queue
    await OfflineSyncQueue.deleteMany({ user: userId });

    // Delete mentorship data
    await Mentorship.deleteMany({
      $or: [{ mentor: userId }, { mentee: userId }],
    });
    await MentorApplication.deleteMany({ user: userId });

    // Delete data exports
    await DataExport.deleteMany({ user: userId });

    // Delete cookie consent
    await CookieConsent.deleteMany({ user: userId });

    // Finally, delete the user account
    await User.findByIdAndDelete(userId);

    logger.info(`User account and all data deleted: ${userId}`);
  } catch (error) {
    logger.error('Error deleting user account:', error);
    throw error;
  }
};

/**
 * Request account deletion (schedules deletion)
 */
export const requestAccountDeletion = async (
  userId: string,
  deletionDelayDays: number = 30
): Promise<void> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + deletionDelayDays);

    user.accountDeletionRequested = new Date();
    user.accountDeletionScheduled = deletionDate;
    await user.save();

    // Send confirmation email
    const { sendEmail } = await import('./email/emailService');
    try {
      await sendEmail({
        to: user.email,
        subject: 'Account Deletion Requested',
        html: `
          <h2>Account Deletion Requested</h2>
          <p>Your account deletion has been requested. Your account will be permanently deleted on ${deletionDate.toLocaleDateString()}.</p>
          <p>If you did not request this, please contact support immediately.</p>
          <p>You can cancel this request by logging into your account before the deletion date.</p>
        `,
      });
    } catch (error) {
      logger.warn('Error sending deletion confirmation email:', error);
    }

    logger.info(`Account deletion requested for user ${userId}, scheduled for ${deletionDate}`);
  } catch (error) {
    logger.error('Error requesting account deletion:', error);
    throw error;
  }
};

/**
 * Cancel account deletion request
 */
export const cancelAccountDeletion = async (userId: string): Promise<void> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.accountDeletionRequested = undefined;
    user.accountDeletionScheduled = undefined;
    await user.save();

    logger.info(`Account deletion cancelled for user ${userId}`);
  } catch (error) {
    logger.error('Error cancelling account deletion:', error);
    throw error;
  }
};

/**
 * Process scheduled account deletions
 */
export const processScheduledDeletions = async (): Promise<number> => {
  try {
    const now = new Date();
    const usersToDelete = await User.find({
      accountDeletionScheduled: { $lte: now },
      accountDeletedAt: { $exists: false },
    });

    let deletedCount = 0;

    for (const user of usersToDelete) {
      try {
        await deleteUserAccount(user._id.toString());
        user.accountDeletedAt = new Date();
        await user.save();
        deletedCount++;
      } catch (error) {
        logger.error(`Error deleting user ${user._id}:`, error);
      }
    }

    logger.info(`Processed ${deletedCount} scheduled account deletions`);
    return deletedCount;
  } catch (error) {
    logger.error('Error processing scheduled deletions:', error);
    return 0;
  }
};

/**
 * Save cookie consent
 */
export const saveCookieConsent = async (
  userId: string | undefined,
  sessionId: string | undefined,
  consent: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  },
  ipAddress?: string,
  userAgent?: string
): Promise<any> => {
  try {
    const consentData: any = {
      necessary: consent.necessary,
      functional: consent.functional,
      analytics: consent.analytics,
      marketing: consent.marketing,
      ipAddress,
      userAgent,
      consentedAt: new Date(),
      lastUpdatedAt: new Date(),
    };

    if (userId) {
      consentData.user = userId;
      
      // Update user's cookie consent
      const user = await User.findById(userId);
      if (user) {
        user.cookieConsent = {
          necessary: consent.necessary,
          functional: consent.functional,
          analytics: consent.analytics,
          marketing: consent.marketing,
          consentedAt: new Date(),
        };
        await user.save();
      }
    } else if (sessionId) {
      consentData.sessionId = sessionId;
    }

    const cookieConsent = await CookieConsent.create(consentData);

    return cookieConsent;
  } catch (error) {
    logger.error('Error saving cookie consent:', error);
    throw error;
  }
};

/**
 * Accept privacy policy
 */
export const acceptPrivacyPolicy = async (
  userId: string,
  version: string
): Promise<void> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.privacyPolicyAccepted = true;
    user.privacyPolicyAcceptedAt = new Date();
    user.privacyPolicyVersion = version;
    await user.save();

    logger.info(`Privacy policy accepted by user ${userId}, version ${version}`);
  } catch (error) {
    logger.error('Error accepting privacy policy:', error);
    throw error;
  }
};

/**
 * Update data processing consent
 */
export const updateDataProcessingConsent = async (
  userId: string,
  consented: boolean
): Promise<void> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.dataProcessingConsent = consented;
    user.dataProcessingConsentAt = new Date();
    await user.save();

    logger.info(`Data processing consent updated for user ${userId}: ${consented}`);
  } catch (error) {
    logger.error('Error updating data processing consent:', error);
    throw error;
  }
};

/**
 * Update marketing consent
 */
export const updateMarketingConsent = async (
  userId: string,
  consented: boolean
): Promise<void> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.marketingConsent = consented;
    user.marketingConsentAt = new Date();
    await user.save();

    logger.info(`Marketing consent updated for user ${userId}: ${consented}`);
  } catch (error) {
    logger.error('Error updating marketing consent:', error);
    throw error;
  }
};


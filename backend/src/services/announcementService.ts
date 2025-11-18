import Announcement, { AnnouncementType, AnnouncementStatus, AnnouncementPriority } from '../models/Announcement';
import User from '../models/User';
import Course from '../models/Course';
import CourseEnrollment from '../models/CourseEnrollment';
import { createNotification } from './notificationService';
import logger from '../utils/logger';

/**
 * Create announcement
 */
export const createAnnouncement = async (
  authorId: string,
  data: {
    title: string;
    content: string;
    type: AnnouncementType;
    priority?: AnnouncementPriority;
    targetAudience?: {
      allUsers?: boolean;
      userRoles?: ('user' | 'admin')[];
      subscriptionTiers?: ('free' | 'premium')[];
      enrolledCourses?: string[];
      specificUsers?: string[];
    };
    courseId?: string;
    scheduledFor?: Date;
    expiresAt?: Date;
    imageUrl?: string;
    videoUrl?: string;
    actionUrl?: string;
  }
): Promise<Announcement> => {
  try {
    const announcement = await Announcement.create({
      ...data,
      author: authorId,
      course: data.courseId,
      targetAudience: {
        allUsers: data.targetAudience?.allUsers ?? true,
        userRoles: data.targetAudience?.userRoles,
        subscriptionTiers: data.targetAudience?.subscriptionTiers,
        enrolledCourses: data.targetAudience?.enrolledCourses,
        specificUsers: data.targetAudience?.specificUsers,
      },
      status: data.scheduledFor && data.scheduledFor > new Date() ? 'scheduled' : 'draft',
    });

    logger.info(`Announcement created: ${announcement._id} by user ${authorId}`);
    return announcement;
  } catch (error) {
    logger.error('Error creating announcement:', error);
    throw error;
  }
};

/**
 * Publish announcement
 */
export const publishAnnouncement = async (
  announcementId: string,
  authorId: string
): Promise<Announcement> => {
  try {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Check if user is author or admin
    const user = await User.findById(authorId);
    if (announcement.author.toString() !== authorId && user?.role !== 'admin') {
      throw new Error('Unauthorized to publish this announcement');
    }

    announcement.status = 'published';
    announcement.publishedAt = new Date();
    await announcement.save();

    // Send notifications to target audience
    await sendAnnouncementNotifications(announcement);

    logger.info(`Announcement published: ${announcementId}`);
    return announcement;
  } catch (error) {
    logger.error('Error publishing announcement:', error);
    throw error;
  }
};

/**
 * Send notifications for announcement
 */
const sendAnnouncementNotifications = async (announcement: Announcement): Promise<void> => {
  try {
    const targetUsers: string[] = [];

    if (announcement.targetAudience?.allUsers) {
      // Get all users
      const users = await User.find({}).select('_id');
      targetUsers.push(...users.map(u => u._id.toString()));
    } else {
      // Build query based on target audience
      const userQuery: any = {};

      if (announcement.targetAudience?.userRoles && announcement.targetAudience.userRoles.length > 0) {
        userQuery.role = { $in: announcement.targetAudience.userRoles };
      }

      if (announcement.targetAudience?.subscriptionTiers && announcement.targetAudience.subscriptionTiers.length > 0) {
        userQuery['subscription.tier'] = { $in: announcement.targetAudience.subscriptionTiers };
      }

      if (Object.keys(userQuery).length > 0) {
        const users = await User.find(userQuery).select('_id');
        targetUsers.push(...users.map(u => u._id.toString()));
      }

      // Add course-enrolled users
      if (announcement.targetAudience?.enrolledCourses && announcement.targetAudience.enrolledCourses.length > 0) {
        const enrollments = await CourseEnrollment.find({
          course: { $in: announcement.targetAudience.enrolledCourses },
        }).select('user');
        const enrolledUserIds = enrollments.map(e => e.user.toString());
        targetUsers.push(...enrolledUserIds);
      }

      // Add specific users
      if (announcement.targetAudience?.specificUsers && announcement.targetAudience.specificUsers.length > 0) {
        targetUsers.push(...announcement.targetAudience.specificUsers.map(id => id.toString()));
      }
    }

    // Remove duplicates
    const uniqueUserIds = [...new Set(targetUsers)];

    // Send notifications
    for (const userId of uniqueUserIds) {
      await createNotification(userId, 'system_announcement', {
        title: announcement.title,
        message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
        actionUrl: announcement.actionUrl || `/announcements/${announcement._id}`,
        relatedCourse: announcement.course?.toString(),
        priority: announcement.priority,
        sendEmail: announcement.priority === 'urgent' || announcement.priority === 'high',
        metadata: {
          announcementId: announcement._id.toString(),
          type: announcement.type,
        },
      }).catch((error) => {
        logger.error(`Error sending announcement notification to user ${userId}:`, error);
      });
    }

    logger.info(`Sent ${uniqueUserIds.length} announcement notifications`);
  } catch (error) {
    logger.error('Error sending announcement notifications:', error);
  }
};

/**
 * Get announcements for a user
 */
export const getUserAnnouncements = async (
  userId: string,
  options?: {
    type?: AnnouncementType;
    courseId?: string;
    includeRead?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<{ announcements: Announcement[]; total: number; unreadCount: number }> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { announcements: [], total: 0, unreadCount: 0 };
    }

    const query: any = {
      status: 'published',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    };

    if (options?.type) {
      query.type = options.type;
    }

    if (options?.courseId) {
      query.course = options.courseId;
    } else if (options?.type !== 'course') {
      // For non-course announcements, check if user is in target audience
      query.$or = [
        { 'targetAudience.allUsers': true },
        { 'targetAudience.userRoles': user.role },
        { 'targetAudience.subscriptionTiers': user.subscription.tier },
        { 'targetAudience.specificUsers': userId },
      ];
    }

    // Get user's enrolled courses for course announcements
    if (options?.type === 'course' || !options?.type) {
      const enrollments = await CourseEnrollment.find({ user: userId }).select('course');
      const enrolledCourseIds = enrollments.map(e => e.course.toString());
      
      if (enrolledCourseIds.length > 0) {
        query.$or = [
          ...(query.$or || []),
          { course: { $in: enrolledCourseIds } },
          { 'targetAudience.enrolledCourses': { $in: enrolledCourseIds } },
        ];
      }
    }

    const total = await Announcement.countDocuments(query);

    // Get unread count
    const unreadQuery = {
      ...query,
      readBy: { $ne: userId },
    };
    const unreadCount = await Announcement.countDocuments(unreadQuery);

    // Get announcements
    let announcements = await Announcement.find(query)
      .populate('author', 'username profilePhoto')
      .populate('course', 'title thumbnail')
      .sort({ priority: -1, publishedAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    // Filter out read announcements if requested
    if (!options?.includeRead) {
      announcements = announcements.filter(
        (announcement) => !announcement.readBy.includes(userId as any)
      );
    }

    return {
      announcements,
      total,
      unreadCount,
    };
  } catch (error) {
    logger.error('Error getting user announcements:', error);
    return { announcements: [], total: 0, unreadCount: 0 };
  }
};

/**
 * Mark announcement as read
 */
export const markAsRead = async (
  announcementId: string,
  userId: string
): Promise<Announcement | null> => {
  try {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return null;
    }

    // Add user to readBy if not already there
    if (!announcement.readBy.includes(userId as any)) {
      announcement.readBy.push(userId as any);
      announcement.views += 1;
      await announcement.save();
    }

    return announcement;
  } catch (error) {
    logger.error('Error marking announcement as read:', error);
    return null;
  }
};

/**
 * Update announcement
 */
export const updateAnnouncement = async (
  announcementId: string,
  userId: string,
  updates: Partial<{
    title: string;
    content: string;
    type: AnnouncementType;
    priority: AnnouncementPriority;
    status: AnnouncementStatus;
    targetAudience: any;
    courseId: string;
    scheduledFor: Date;
    expiresAt: Date;
    imageUrl: string;
    videoUrl: string;
    actionUrl: string;
  }>
): Promise<Announcement | null> => {
  try {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return null;
    }

    // Check if user is author or admin
    const user = await User.findById(userId);
    if (announcement.author.toString() !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to update this announcement');
    }

    // Update fields
    if (updates.title) announcement.title = updates.title;
    if (updates.content) announcement.content = updates.content;
    if (updates.type) announcement.type = updates.type;
    if (updates.priority) announcement.priority = updates.priority;
    if (updates.status) announcement.status = updates.status;
    if (updates.targetAudience) announcement.targetAudience = updates.targetAudience as any;
    if (updates.courseId) announcement.course = updates.courseId as any;
    if (updates.scheduledFor) announcement.scheduledFor = updates.scheduledFor;
    if (updates.expiresAt) announcement.expiresAt = updates.expiresAt;
    if (updates.imageUrl !== undefined) announcement.imageUrl = updates.imageUrl;
    if (updates.videoUrl !== undefined) announcement.videoUrl = updates.videoUrl;
    if (updates.actionUrl !== undefined) announcement.actionUrl = updates.actionUrl;

    // Update status based on scheduledFor
    if (updates.scheduledFor) {
      if (updates.scheduledFor > new Date()) {
        announcement.status = 'scheduled';
      } else if (announcement.status === 'scheduled') {
        announcement.status = 'published';
        announcement.publishedAt = new Date();
        // Send notifications if publishing
        await sendAnnouncementNotifications(announcement);
      }
    }

    await announcement.save();

    logger.info(`Announcement updated: ${announcementId}`);
    return announcement;
  } catch (error) {
    logger.error('Error updating announcement:', error);
    throw error;
  }
};

/**
 * Delete announcement
 */
export const deleteAnnouncement = async (
  announcementId: string,
  userId: string
): Promise<boolean> => {
  try {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return false;
    }

    // Check if user is author or admin
    const user = await User.findById(userId);
    if (announcement.author.toString() !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to delete this announcement');
    }

    await announcement.deleteOne();
    logger.info(`Announcement deleted: ${announcementId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting announcement:', error);
    throw error;
  }
};

/**
 * Get all announcements (admin)
 */
export const getAllAnnouncements = async (
  options?: {
    status?: AnnouncementStatus;
    type?: AnnouncementType;
    limit?: number;
    offset?: number;
  }
): Promise<{ announcements: Announcement[]; total: number }> => {
  try {
    const query: any = {};

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.type) {
      query.type = options.type;
    }

    const total = await Announcement.countDocuments(query);

    const announcements = await Announcement.find(query)
      .populate('author', 'username profilePhoto')
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return {
      announcements,
      total,
    };
  } catch (error) {
    logger.error('Error getting all announcements:', error);
    return { announcements: [], total: 0 };
  }
};

/**
 * Process scheduled announcements (should be run periodically)
 */
export const processScheduledAnnouncements = async (): Promise<number> => {
  try {
    const now = new Date();
    const scheduledAnnouncements = await Announcement.find({
      status: 'scheduled',
      scheduledFor: { $lte: now },
    });

    let publishedCount = 0;
    for (const announcement of scheduledAnnouncements) {
      announcement.status = 'published';
      announcement.publishedAt = now;
      await announcement.save();
      await sendAnnouncementNotifications(announcement);
      publishedCount++;
    }

    logger.info(`Processed ${publishedCount} scheduled announcements`);
    return publishedCount;
  } catch (error) {
    logger.error('Error processing scheduled announcements:', error);
    return 0;
  }
};


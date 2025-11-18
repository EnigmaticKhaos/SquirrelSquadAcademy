import Notification, { NotificationType, INotification } from '../models/Notification';
import User from '../models/User';
import { sendEmail } from './email/emailService';
import logger from '../utils/logger';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.io instance for real-time notifications
 */
export const initializeNotificationSocket = (socketServer: SocketIOServer) => {
  io = socketServer;
};

/**
 * Check if user wants to receive a specific notification type
 */
const shouldSendNotification = async (
  userId: string,
  type: NotificationType,
  channel: 'email' | 'inApp' = 'inApp'
): Promise<boolean> => {
  try {
    const user = await User.findById(userId).select('notificationPreferences');
    if (!user || !user.notificationPreferences) {
      return channel === 'inApp'; // Default to in-app notifications
    }

    const prefs = user.notificationPreferences;
    
    // Check channel preference
    if (channel === 'email' && prefs.email === false) {
      return false;
    }
    if (channel === 'inApp' && prefs.inApp === false) {
      return false;
    }

    // Check type-specific preference
    const typeKey = `notify_${type}`;
    if (prefs[typeKey] === false) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error checking notification preferences:', error);
    return true; // Default to allowing notifications on error
  }
};

/**
 * Create and send notification
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  data: {
    title: string;
    message: string;
    actionUrl?: string;
    relatedUser?: string;
    relatedCourse?: string;
    relatedPost?: string;
    relatedComment?: string;
    relatedMessage?: string;
    relatedAchievement?: string;
    relatedBadge?: string;
    relatedAssignment?: string;
    relatedForumPost?: string;
    metadata?: any;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    sendEmail?: boolean;
  }
): Promise<INotification | null> => {
  try {
    // Check if user wants in-app notifications
    const shouldSendInApp = await shouldSendNotification(userId, type, 'inApp');
    
    if (!shouldSendInApp && !data.sendEmail) {
      return null; // User has disabled this notification type
    }

    // Create notification
    const notification = await Notification.create({
      user: userId,
      type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      relatedUser: data.relatedUser,
      relatedCourse: data.relatedCourse,
      relatedPost: data.relatedPost,
      relatedComment: data.relatedComment,
      relatedMessage: data.relatedMessage,
      relatedAchievement: data.relatedAchievement,
      relatedBadge: data.relatedBadge,
      relatedAssignment: data.relatedAssignment,
      relatedForumPost: data.relatedForumPost,
      metadata: data.metadata,
      priority: data.priority || 'normal',
    });

    // Send real-time notification via Socket.io
    if (io && shouldSendInApp) {
      io.to(`user:${userId}`).emit('notification', notification);
    }

    // Send push notification if user has push subscriptions
    if (shouldSendInApp) {
      try {
        const { sendPushNotification } = await import('./pushNotificationService');
        await sendPushNotification(userId, {
          title: data.title,
          body: data.message,
          data: {
            notificationId: notification._id.toString(),
            type: type,
            actionUrl: data.actionUrl,
            ...data.metadata,
          },
          tag: type, // Group notifications by type
          requireInteraction: data.priority === 'urgent' || data.priority === 'high',
        }).catch((error) => {
          logger.warn('Error sending push notification:', error);
        });
      } catch (error) {
        logger.warn('Push notification service not available:', error);
      }
    }

    // Send email notification if requested and user has email enabled
    if (data.sendEmail) {
      const shouldSendEmail = await shouldSendNotification(userId, type, 'email');
      if (shouldSendEmail) {
        try {
          const user = await User.findById(userId).select('email username');
          if (user) {
            await sendEmail({
              to: user.email,
              subject: data.title,
              html: `
                <h2>${data.title}</h2>
                <p>${data.message}</p>
                ${data.actionUrl ? `<p><a href="${data.actionUrl}">View Details</a></p>` : ''}
              `,
            });
          }
        } catch (emailError) {
          logger.error('Error sending notification email:', emailError);
          // Don't fail the notification creation if email fails
        }
      }
    }

    logger.info(`Notification created: ${type} for user ${userId}`);
    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (
  notificationId: string,
  userId: string
): Promise<INotification | null> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        user: userId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );

    return notification;
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return null;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId: string): Promise<number> => {
  try {
    const result = await Notification.updateMany(
      {
        user: userId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    return result.modifiedCount || 0;
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    return 0;
  }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (
  userId: string,
  options?: {
    read?: boolean;
    type?: NotificationType;
    limit?: number;
    offset?: number;
  }
): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> => {
  try {
    const query: any = { user: userId };

    if (options?.read !== undefined) {
      query.read = options.read;
    }

    if (options?.type) {
      query.type = options.type;
    }

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    const notifications = await Notification.find(query)
      .populate('relatedUser', 'username profilePhoto')
      .populate('relatedCourse', 'title thumbnail')
      .populate('relatedPost', 'content')
      .populate('relatedComment', 'content')
      .populate('relatedAchievement', 'name icon')
      .populate('relatedBadge', 'name icon')
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return {
      notifications,
      total,
      unreadCount,
    };
  } catch (error) {
    logger.error('Error getting user notifications:', error);
    return { notifications: [], total: 0, unreadCount: 0 };
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<boolean> => {
  try {
    const result = await Notification.deleteOne({
      _id: notificationId,
      user: userId,
    });

    return result.deletedCount === 1;
  } catch (error) {
    logger.error('Error deleting notification:', error);
    return false;
  }
};

/**
 * Delete all read notifications
 */
export const deleteAllRead = async (userId: string): Promise<number> => {
  try {
    const result = await Notification.deleteMany({
      user: userId,
      read: true,
    });

    return result.deletedCount || 0;
  } catch (error) {
    logger.error('Error deleting read notifications:', error);
    return 0;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    return await Notification.countDocuments({
      user: userId,
      read: false,
    });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    return 0;
  }
};


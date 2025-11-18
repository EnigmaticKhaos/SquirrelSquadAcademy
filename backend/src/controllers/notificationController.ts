import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getUnreadCount,
} from '../services/notificationService';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { read, type, limit = 50, offset = 0 } = req.query;

  const { notifications, total, unreadCount } = await getUserNotifications(userId, {
    read: read === 'true' ? true : read === 'false' ? false : undefined,
    type: type as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    notifications,
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadNotificationCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const count = await getUnreadCount(userId);

  res.json({
    success: true,
    unreadCount: count,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const notification = await markAsRead(id, userId);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found or already read',
    });
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
    notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const count = await markAllAsRead(userId);

  res.json({
    success: true,
    message: `Marked ${count} notifications as read`,
    count,
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotificationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const deleted = await deleteNotification(id, userId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  res.json({
    success: true,
    message: 'Notification deleted',
  });
});

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/read
// @access  Private
export const deleteReadNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const count = await deleteAllRead(userId);

  res.json({
    success: true,
    message: `Deleted ${count} read notifications`,
    count,
  });
});


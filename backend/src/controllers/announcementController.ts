import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  createAnnouncement,
  publishAnnouncement,
  getUserAnnouncements,
  markAsRead,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  processScheduledAnnouncements,
} from '../services/announcementService';

// @desc    Get user announcements
// @route   GET /api/announcements
// @access  Private
export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { type, courseId, includeRead, limit = 50, offset = 0 } = req.query;

  const { announcements, total, unreadCount } = await getUserAnnouncements(userId, {
    type: type as any,
    courseId: courseId as string,
    includeRead: includeRead === 'true',
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: announcements.length,
    total,
    unreadCount,
    announcements,
  });
});

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
export const getAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const { getUserAnnouncements } = await import('../services/announcementService');
  const { announcements } = await getUserAnnouncements(userId, {
    includeRead: true,
    limit: 1000,
  });

  const announcement = announcements.find((a) => a._id.toString() === id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Mark as read
  await markAsRead(id, userId);

  res.json({
    success: true,
    announcement,
  });
});

// @desc    Mark announcement as read
// @route   PUT /api/announcements/:id/read
// @access  Private
export const markAnnouncementAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const announcement = await markAsRead(id, userId);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  res.json({
    success: true,
    message: 'Announcement marked as read',
    announcement,
  });
});

// @desc    Create announcement (admin only)
// @route   POST /api/announcements
// @access  Private/Admin
export const createAnnouncementHandler = asyncHandler(async (req: Request, res: Response) => {
  const authorId = req.user._id.toString();
  const {
    title,
    content,
    type,
    priority,
    targetAudience,
    courseId,
    scheduledFor,
    expiresAt,
    imageUrl,
    videoUrl,
    actionUrl,
  } = req.body;

  if (!title || !content || !type) {
    return res.status(400).json({
      success: false,
      message: 'Title, content, and type are required',
    });
  }

  const announcement = await createAnnouncement(authorId, {
    title,
    content,
    type,
    priority,
    targetAudience,
    courseId,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    imageUrl,
    videoUrl,
    actionUrl,
  });

  res.status(201).json({
    success: true,
    message: 'Announcement created successfully',
    announcement,
  });
});

// @desc    Publish announcement (admin only)
// @route   POST /api/announcements/:id/publish
// @access  Private/Admin
export const publishAnnouncementHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const announcement = await publishAnnouncement(id, userId);

  res.json({
    success: true,
    message: 'Announcement published successfully',
    announcement,
  });
});

// @desc    Update announcement (admin only)
// @route   PUT /api/announcements/:id
// @access  Private/Admin
export const updateAnnouncementHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const updates = req.body;

  // Convert date strings to Date objects
  if (updates.scheduledFor) {
    updates.scheduledFor = new Date(updates.scheduledFor);
  }
  if (updates.expiresAt) {
    updates.expiresAt = new Date(updates.expiresAt);
  }

  const announcement = await updateAnnouncement(id, userId, updates);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  res.json({
    success: true,
    message: 'Announcement updated successfully',
    announcement,
  });
});

// @desc    Delete announcement (admin only)
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
export const deleteAnnouncementHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const deleted = await deleteAnnouncement(id, userId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  res.json({
    success: true,
    message: 'Announcement deleted successfully',
  });
});

// @desc    Get all announcements (admin only)
// @route   GET /api/announcements/admin/all
// @access  Private/Admin
export const getAllAnnouncementsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { status, type, limit = 50, offset = 0 } = req.query;

  const { announcements, total } = await getAllAnnouncements({
    status: status as any,
    type: type as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: announcements.length,
    total,
    announcements,
  });
});

// @desc    Process scheduled announcements (admin only, can be called by cron job)
// @route   POST /api/announcements/process-scheduled
// @access  Private/Admin
export const processScheduledHandler = asyncHandler(async (req: Request, res: Response) => {
  const publishedCount = await processScheduledAnnouncements();

  res.json({
    success: true,
    message: `Processed ${publishedCount} scheduled announcements`,
    publishedCount,
  });
});


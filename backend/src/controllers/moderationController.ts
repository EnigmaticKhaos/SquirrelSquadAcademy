import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  createReport,
  reviewReport,
  issueWarning,
  suspendUser,
  banUser,
  unbanUser,
  getReports,
  getUserWarnings,
  checkUserModerationStatus,
} from '../services/moderationService';

// @desc    Create content report
// @route   POST /api/moderation/reports
// @access  Private
export const createContentReport = asyncHandler(async (req: Request, res: Response) => {
  const reporterId = req.user._id.toString();
  const { contentType, contentId, reason, description, evidence } = req.body;

  if (!contentType || !contentId || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Content type, content ID, and reason are required',
    });
  }

  const report = await createReport(reporterId, {
    contentType,
    contentId,
    reason,
    description,
    evidence,
  });

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully',
    report,
  });
});

// @desc    Get reports (admin only)
// @route   GET /api/moderation/reports
// @access  Private/Admin
export const getModerationReports = asyncHandler(async (req: Request, res: Response) => {
  const { status, priority, contentType, limit = 50, offset = 0 } = req.query;

  const { reports, total } = await getReports({
    status: status as any,
    priority: priority as string,
    contentType: contentType as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: reports.length,
    total,
    reports,
  });
});

// @desc    Get single report (admin only)
// @route   GET /api/moderation/reports/:id
// @access  Private/Admin
export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ContentReport = (await import('../models/ContentReport')).default;
  const report = await ContentReport.findById(id)
    .populate('reporter', 'username profilePhoto')
    .populate('reviewedBy', 'username profilePhoto');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  res.json({
    success: true,
    report,
  });
});

// @desc    Review report (admin only)
// @route   PUT /api/moderation/reports/:id/review
// @access  Private/Admin
export const reviewContentReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const moderatorId = req.user._id.toString();
  const { status, actionType, actionDetails, moderationNotes } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required',
    });
  }

  const report = await reviewReport(id, moderatorId, {
    status,
    actionType,
    actionDetails,
    moderationNotes,
  });

  res.json({
    success: true,
    message: 'Report reviewed successfully',
    report,
  });
});

// @desc    Issue warning (admin only)
// @route   POST /api/moderation/warnings
// @access  Private/Admin
export const issueUserWarning = asyncHandler(async (req: Request, res: Response) => {
  const moderatorId = req.user._id.toString();
  const { userId, type, severity, reason, description, relatedReport, relatedContent, expiresInDays } = req.body;

  if (!userId || !type || !severity || !reason || !description) {
    return res.status(400).json({
      success: false,
      message: 'User ID, type, severity, reason, and description are required',
    });
  }

  const warning = await issueWarning(userId, moderatorId, {
    type,
    severity,
    reason,
    description,
    relatedReport,
    relatedContent,
    expiresInDays,
  });

  res.status(201).json({
    success: true,
    message: 'Warning issued successfully',
    warning,
  });
});

// @desc    Get user warnings
// @route   GET /api/moderation/warnings/user/:userId
// @access  Private/Admin
export const getUserWarningsList = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { includeExpired } = req.query;

  const warnings = await getUserWarnings(userId, includeExpired === 'true');

  res.json({
    success: true,
    count: warnings.length,
    warnings,
  });
});

// @desc    Suspend user (admin only)
// @route   POST /api/moderation/users/:userId/suspend
// @access  Private/Admin
export const suspendUserAccount = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const moderatorId = req.user._id.toString();
  const { reason, duration = 7 } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Reason is required',
    });
  }

  await suspendUser(userId, {
    reason,
    duration,
    moderatorId,
  });

  res.json({
    success: true,
    message: 'User suspended successfully',
  });
});

// @desc    Ban user (admin only)
// @route   POST /api/moderation/users/:userId/ban
// @access  Private/Admin
export const banUserAccount = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const moderatorId = req.user._id.toString();
  const { reason, bannedUntil } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Reason is required',
    });
  }

  await banUser(userId, {
    reason,
    moderatorId,
    bannedUntil: bannedUntil ? new Date(bannedUntil) : undefined,
  });

  res.json({
    success: true,
    message: 'User banned successfully',
  });
});

// @desc    Unban user (admin only)
// @route   POST /api/moderation/users/:userId/unban
// @access  Private/Admin
export const unbanUserAccount = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const moderatorId = req.user._id.toString();

  await unbanUser(userId, moderatorId);

  res.json({
    success: true,
    message: 'User unbanned successfully',
  });
});

// @desc    Get moderation statistics (admin only)
// @route   GET /api/moderation/stats
// @access  Private/Admin
export const getModerationStats = asyncHandler(async (req: Request, res: Response) => {
  const ContentReport = (await import('../models/ContentReport')).default;
  const UserWarning = (await import('../models/UserWarning')).default;
  const User = (await import('../models/User')).default;

  const [
    totalReports,
    pendingReports,
    resolvedReports,
    totalWarnings,
    activeWarnings,
    bannedUsers,
    suspendedUsers,
  ] = await Promise.all([
    ContentReport.countDocuments(),
    ContentReport.countDocuments({ status: 'pending' }),
    ContentReport.countDocuments({ status: 'resolved' }),
    UserWarning.countDocuments(),
    UserWarning.countDocuments({ isActive: true }),
    User.countDocuments({ 'moderationStatus.isBanned': true }),
    User.countDocuments({ 'moderationStatus.isSuspended': true }),
  ]);

  res.json({
    success: true,
    stats: {
      reports: {
        total: totalReports,
        pending: pendingReports,
        resolved: resolvedReports,
      },
      warnings: {
        total: totalWarnings,
        active: activeWarnings,
      },
      users: {
        banned: bannedUsers,
        suspended: suspendedUsers,
      },
    },
  });
});


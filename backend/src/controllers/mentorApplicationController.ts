import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  submitMentorApplication,
  approveMentorApplication,
  rejectMentorApplication,
  bulkApproveApplications,
  bulkRejectApplications,
  getApplicationsForReview,
  getUserApplication,
  updateMentorAvailability,
  updateMentorStats,
} from '../services/mentorApplicationService';

// @desc    Submit mentor application
// @route   POST /api/mentor-applications
// @access  Private
export const submitApplication = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { motivation, specialties, experience, availability, maxMentees } = req.body;

  if (!motivation || !specialties || specialties.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Motivation and at least one specialty are required',
    });
  }

  const application = await submitMentorApplication(userId, {
    motivation,
    specialties,
    experience,
    availability,
    maxMentees,
  });

  res.status(201).json({
    success: true,
    message: application.status === 'approved'
      ? 'Application submitted and auto-approved!'
      : application.status === 'rejected'
      ? 'Application submitted but did not meet requirements'
      : 'Application submitted successfully',
    application,
  });
});

// @desc    Get user's application
// @route   GET /api/mentor-applications/my-application
// @access  Private
export const getMyApplication = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const application = await getUserApplication(userId);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'No application found',
    });
  }

  res.json({
    success: true,
    application,
  });
});

// @desc    Get applications for admin review
// @route   GET /api/mentor-applications/admin
// @access  Private/Admin
export const getApplications = asyncHandler(async (req: Request, res: Response) => {
  const { status, priority, limit = 50, offset = 0 } = req.query;

  const { applications, total, stats } = await getApplicationsForReview({
    status: status as any,
    priority: priority as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: applications.length,
    total,
    stats,
    applications,
  });
});

// @desc    Approve application
// @route   POST /api/mentor-applications/:id/approve
// @access  Private/Admin
export const approveApplication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.user._id.toString();
  const { notes } = req.body;

  await approveMentorApplication(id, adminId, { notes });

  res.json({
    success: true,
    message: 'Application approved successfully',
  });
});

// @desc    Reject application
// @route   POST /api/mentor-applications/:id/reject
// @access  Private/Admin
export const rejectApplication = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.user._id.toString();
  const { reason, notes } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required',
    });
  }

  await rejectMentorApplication(id, adminId, { reason, notes });

  res.json({
    success: true,
    message: 'Application rejected successfully',
  });
});

// @desc    Bulk approve applications
// @route   POST /api/mentor-applications/bulk-approve
// @access  Private/Admin
export const bulkApprove = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user._id.toString();
  const { applicationIds } = req.body;

  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Application IDs array is required',
    });
  }

  const { approved, failed } = await bulkApproveApplications(applicationIds, adminId);

  res.json({
    success: true,
    message: `Approved ${approved} application(s)${failed > 0 ? `, ${failed} failed` : ''}`,
    approved,
    failed,
  });
});

// @desc    Bulk reject applications
// @route   POST /api/mentor-applications/bulk-reject
// @access  Private/Admin
export const bulkReject = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user._id.toString();
  const { applicationIds, reason } = req.body;

  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Application IDs array is required',
    });
  }

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required',
    });
  }

  const { rejected, failed } = await bulkRejectApplications(applicationIds, adminId, reason);

  res.json({
    success: true,
    message: `Rejected ${rejected} application(s)${failed > 0 ? `, ${failed} failed` : ''}`,
    rejected,
    failed,
  });
});

// @desc    Update mentor availability
// @route   PUT /api/mentor-applications/availability
// @access  Private
export const updateAvailability = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { isAvailable } = req.body;

  if (typeof isAvailable !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isAvailable must be a boolean',
    });
  }

  await updateMentorAvailability(userId, isAvailable);

  res.json({
    success: true,
    message: 'Availability updated successfully',
  });
});

// @desc    Update mentor stats (can be called periodically)
// @route   POST /api/mentor-applications/update-stats/:mentorId
// @access  Private/Admin
export const updateStats = asyncHandler(async (req: Request, res: Response) => {
  const { mentorId } = req.params;

  await updateMentorStats(mentorId);

  res.json({
    success: true,
    message: 'Mentor stats updated successfully',
  });
});


import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  joinWaitlist,
  leaveWaitlist,
  getWaitlistPosition,
  getCourseWaitlist,
  getUserWaitlist,
  isCourseFull,
  hasWaitlistEnabled,
  notifyNextWaitlistUser,
  cleanupExpiredWaitlistEntries,
} from '../services/courseWaitlistService';
import Course from '../models/Course';

// @desc    Join course waitlist
// @route   POST /api/course-waitlist/:courseId/join
// @access  Private
export const join = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();
  const { expiresInDays } = req.body;

  try {
    const waitlistEntry = await joinWaitlist(userId, courseId, expiresInDays);

    res.status(201).json({
      success: true,
      message: 'Successfully joined waitlist',
      waitlistEntry,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to join waitlist',
    });
  }
});

// @desc    Leave course waitlist
// @route   POST /api/course-waitlist/:courseId/leave
// @access  Private
export const leave = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  try {
    await leaveWaitlist(userId, courseId);

    res.json({
      success: true,
      message: 'Successfully left waitlist',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to leave waitlist',
    });
  }
});

// @desc    Get user's waitlist position
// @route   GET /api/course-waitlist/:courseId/position
// @access  Private
export const getPosition = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  const position = await getWaitlistPosition(userId, courseId);

  if (position === null) {
    return res.status(404).json({
      success: false,
      message: 'You are not on the waitlist for this course',
    });
  }

  res.json({
    success: true,
    position,
  });
});

// @desc    Get course waitlist (Admin)
// @route   GET /api/course-waitlist/:courseId
// @access  Private/Admin
export const getWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { status, limit = 50, offset = 0 } = req.query;

  const { waitlist, total } = await getCourseWaitlist(courseId, {
    status: status as string,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: waitlist.length,
    total,
    waitlist,
  });
});

// @desc    Get user's waitlist entries
// @route   GET /api/course-waitlist/user/entries
// @access  Private
export const getUserEntries = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { status, limit = 50, offset = 0 } = req.query;

  const { waitlist, total } = await getUserWaitlist(userId, {
    status: status as string,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: waitlist.length,
    total,
    waitlist,
  });
});

// @desc    Check if course is full
// @route   GET /api/course-waitlist/:courseId/status
// @access  Public
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?._id?.toString();

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  const full = await isCourseFull(courseId);
  const waitlistEnabled = await hasWaitlistEnabled(courseId);

  let userPosition: number | null = null;
  if (userId) {
    userPosition = await getWaitlistPosition(userId, courseId);
  }

  res.json({
    success: true,
    isFull: full,
    hasWaitlist: waitlistEnabled,
    maxEnrollments: course.maxEnrollments,
    currentEnrollments: course.enrollmentCount,
    userPosition,
  });
});

// @desc    Manually notify next waitlist user (Admin)
// @route   POST /api/course-waitlist/:courseId/notify-next
// @access  Private/Admin
export const notifyNext = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  const notified = await notifyNextWaitlistUser(courseId);

  if (!notified) {
    return res.status(400).json({
      success: false,
      message: 'No users to notify or course is still full',
    });
  }

  res.json({
    success: true,
    message: 'Next user on waitlist has been notified',
  });
});

// @desc    Cleanup expired waitlist entries (Admin)
// @route   POST /api/course-waitlist/cleanup
// @access  Private/Admin
export const cleanup = asyncHandler(async (req: Request, res: Response) => {
  const cleaned = await cleanupExpiredWaitlistEntries();

  res.json({
    success: true,
    message: `Cleaned up ${cleaned} expired waitlist entries`,
    cleanedCount: cleaned,
  });
});


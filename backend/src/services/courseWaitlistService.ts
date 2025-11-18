import CourseWaitlist from '../models/CourseWaitlist';
import Course from '../models/Course';
import CourseEnrollment from '../models/CourseEnrollment';
import User from '../models/User';
import { sendEmail } from './email/emailService';
import logger from '../utils/logger';

/**
 * Check if course is full
 */
export const isCourseFull = async (courseId: string): Promise<boolean> => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return false;
    }

    // If no maxEnrollments set, course is never full
    if (!course.maxEnrollments) {
      return false;
    }

    return course.enrollmentCount >= course.maxEnrollments;
  } catch (error) {
    logger.error('Error checking if course is full:', error);
    return false;
  }
};

/**
 * Check if course has waitlist enabled
 */
export const hasWaitlistEnabled = async (courseId: string): Promise<boolean> => {
  try {
    const course = await Course.findById(courseId);
    return course?.hasWaitlist === true;
  } catch (error) {
    logger.error('Error checking waitlist status:', error);
    return false;
  }
};

/**
 * Join waitlist
 */
export const joinWaitlist = async (
  userId: string,
  courseId: string,
  expiresInDays?: number
): Promise<CourseWaitlist> => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (!course.hasWaitlist) {
      throw new Error('Waitlist is not enabled for this course');
    }

    // Check if user is already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      throw new Error('You are already enrolled in this course');
    }

    // Check if user is already on waitlist
    const existingWaitlist = await CourseWaitlist.findOne({
      user: userId,
      course: courseId,
      status: { $in: ['waiting', 'notified'] },
    });

    if (existingWaitlist) {
      throw new Error('You are already on the waitlist for this course');
    }

    // Get current waitlist count to determine position
    const waitlistCount = await CourseWaitlist.countDocuments({
      course: courseId,
      status: { $in: ['waiting', 'notified'] },
    });

    const position = waitlistCount + 1;

    // Calculate expiration date if provided
    let expiresAt: Date | undefined;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const waitlistEntry = await CourseWaitlist.create({
      user: userId,
      course: courseId,
      position,
      status: 'waiting',
      expiresAt,
    });

    logger.info(`User ${userId} joined waitlist for course ${courseId} at position ${position}`);
    return waitlistEntry;
  } catch (error) {
    logger.error('Error joining waitlist:', error);
    throw error;
  }
};

/**
 * Leave waitlist
 */
export const leaveWaitlist = async (
  userId: string,
  courseId: string
): Promise<void> => {
  try {
    const waitlistEntry = await CourseWaitlist.findOne({
      user: userId,
      course: courseId,
      status: { $in: ['waiting', 'notified'] },
    });

    if (!waitlistEntry) {
      throw new Error('You are not on the waitlist for this course');
    }

    waitlistEntry.status = 'removed';
    await waitlistEntry.save();

    // Update positions of remaining waitlist entries
    await updateWaitlistPositions(courseId);

    logger.info(`User ${userId} left waitlist for course ${courseId}`);
  } catch (error) {
    logger.error('Error leaving waitlist:', error);
    throw error;
  }
};

/**
 * Update waitlist positions after someone leaves
 */
const updateWaitlistPositions = async (courseId: string): Promise<void> => {
  try {
    const waitlistEntries = await CourseWaitlist.find({
      course: courseId,
      status: { $in: ['waiting', 'notified'] },
    }).sort({ position: 1 });

    // Reassign positions sequentially
    for (let i = 0; i < waitlistEntries.length; i++) {
      waitlistEntries[i].position = i + 1;
      await waitlistEntries[i].save();
    }
  } catch (error) {
    logger.error('Error updating waitlist positions:', error);
  }
};

/**
 * Get user's waitlist position
 */
export const getWaitlistPosition = async (
  userId: string,
  courseId: string
): Promise<number | null> => {
  try {
    const waitlistEntry = await CourseWaitlist.findOne({
      user: userId,
      course: courseId,
      status: { $in: ['waiting', 'notified'] },
    });

    return waitlistEntry?.position || null;
  } catch (error) {
    logger.error('Error getting waitlist position:', error);
    return null;
  }
};

/**
 * Get waitlist for a course
 */
export const getCourseWaitlist = async (
  courseId: string,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ waitlist: CourseWaitlist[]; total: number }> => {
  try {
    const query: any = { course: courseId };

    if (options?.status) {
      query.status = options.status;
    } else {
      query.status = { $in: ['waiting', 'notified'] };
    }

    const total = await CourseWaitlist.countDocuments(query);

    const waitlist = await CourseWaitlist.find(query)
      .populate('user', 'username email profilePhoto')
      .sort({ position: 1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { waitlist, total };
  } catch (error) {
    logger.error('Error getting course waitlist:', error);
    return { waitlist: [], total: 0 };
  }
};

/**
 * Get user's waitlist entries
 */
export const getUserWaitlist = async (
  userId: string,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ waitlist: CourseWaitlist[]; total: number }> => {
  try {
    const query: any = { user: userId };

    if (options?.status) {
      query.status = options.status;
    }

    const total = await CourseWaitlist.countDocuments(query);

    const waitlist = await CourseWaitlist.find(query)
      .populate('course', 'title thumbnail difficulty estimatedDuration price isFree')
      .sort({ joinedAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { waitlist, total };
  } catch (error) {
    logger.error('Error getting user waitlist:', error);
    return { waitlist: [], total: 0 };
  }
};

/**
 * Notify next user on waitlist when spot opens
 */
export const notifyNextWaitlistUser = async (courseId: string): Promise<boolean> => {
  try {
    const course = await Course.findById(courseId);
    if (!course || !course.hasWaitlist) {
      return false;
    }

    // Check if course is still full
    const isFull = await isCourseFull(courseId);
    if (isFull) {
      return false; // Course is still full, no need to notify
    }

    // Get next user on waitlist
    const nextEntry = await CourseWaitlist.findOne({
      course: courseId,
      status: 'waiting',
    }).sort({ position: 1 }).populate('user');

    if (!nextEntry) {
      return false; // No one on waitlist
    }

    const user = nextEntry.user as any;

    // Update waitlist entry status
    nextEntry.status = 'notified';
    nextEntry.notifiedAt = new Date();
    nextEntry.notificationSent = true;
    await nextEntry.save();

    // Send notification email
    try {
      await sendEmail({
        to: user.email,
        subject: `Spot Available: ${course.title}`,
        html: `
          <h2>Great News! A Spot Has Opened Up</h2>
          <p>Hi ${user.username},</p>
          <p>A spot has become available in <strong>${course.title}</strong>!</p>
          <p>You were on the waitlist and now have the opportunity to enroll. Spots are limited, so don't wait too long.</p>
          <p><a href="${process.env.FRONTEND_URL || 'https://squirrelsquadacademy.com'}/courses/${courseId}">Enroll Now</a></p>
          <p>This notification is valid for 48 hours. After that, the spot will be offered to the next person on the waitlist.</p>
        `,
      });
    } catch (emailError) {
      logger.error('Error sending waitlist notification email:', emailError);
      // Don't fail the whole operation if email fails
    }

    logger.info(`Notified user ${user._id} about available spot in course ${courseId}`);
    return true;
  } catch (error) {
    logger.error('Error notifying next waitlist user:', error);
    return false;
  }
};

/**
 * Process waitlist when enrollment drops
 * This should be called when someone drops a course or enrollment is removed
 */
export const processWaitlistOnEnrollmentDrop = async (courseId: string): Promise<void> => {
  try {
    // Notify the next user on waitlist
    await notifyNextWaitlistUser(courseId);
  } catch (error) {
    logger.error('Error processing waitlist on enrollment drop:', error);
  }
};

/**
 * Auto-enroll notified user if they enroll within notification window
 */
export const checkAndEnrollNotifiedUser = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  try {
    const waitlistEntry = await CourseWaitlist.findOne({
      user: userId,
      course: courseId,
      status: 'notified',
    });

    if (!waitlistEntry) {
      return false; // User is not in notified status
    }

    // Check if notification is still valid (48 hours)
    const notificationAge = Date.now() - waitlistEntry.notifiedAt!.getTime();
    const hoursSinceNotification = notificationAge / (1000 * 60 * 60);

    if (hoursSinceNotification > 48) {
      // Notification expired, move to next user
      waitlistEntry.status = 'waiting';
      waitlistEntry.notifiedAt = undefined;
      waitlistEntry.notificationSent = false;
      await waitlistEntry.save();
      await updateWaitlistPositions(courseId);
      await notifyNextWaitlistUser(courseId);
      return false;
    }

    // Check if course is still available
    const isFull = await isCourseFull(courseId);
    if (isFull) {
      // Course is full again, keep user on waitlist
      waitlistEntry.status = 'waiting';
      waitlistEntry.notifiedAt = undefined;
      waitlistEntry.notificationSent = false;
      await waitlistEntry.save();
      await updateWaitlistPositions(courseId);
      return false;
    }

    // Mark as enrolled
    waitlistEntry.status = 'enrolled';
    waitlistEntry.enrolledAt = new Date();
    await waitlistEntry.save();

    logger.info(`Auto-enrolled notified user ${userId} in course ${courseId}`);
    return true;
  } catch (error) {
    logger.error('Error checking and enrolling notified user:', error);
    return false;
  }
};

/**
 * Clean up expired waitlist entries
 */
export const cleanupExpiredWaitlistEntries = async (): Promise<number> => {
  try {
    const now = new Date();
    const result = await CourseWaitlist.updateMany(
      {
        expiresAt: { $exists: true, $lte: now },
        status: { $in: ['waiting', 'notified'] },
      },
      {
        $set: { status: 'expired' },
      }
    );

    // Update positions after cleanup
    const courses = await CourseWaitlist.distinct('course', {
      status: 'expired',
      expiresAt: { $exists: true, $lte: now },
    });

    for (const courseId of courses) {
      await updateWaitlistPositions(courseId.toString());
    }

    logger.info(`Cleaned up ${result.modifiedCount} expired waitlist entries`);
    return result.modifiedCount || 0;
  } catch (error) {
    logger.error('Error cleaning up expired waitlist entries:', error);
    return 0;
  }
};


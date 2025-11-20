import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course';
import Module from '../models/Module';
import Lesson from '../models/Lesson';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const {
    courseType,
    difficulty,
    category,
    tags,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  const query: any = { 
    status: { $in: ['published', 'coming_soon'] } 
  };

  if (courseType) query.courseType = courseType;
  if (difficulty) query.difficulty = difficulty;
  if (category) query.category = category;
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    query.tags = { $in: tagArray };
  }
  if (search) {
    query.$text = { $search: search as string };
  }

  const skip = (Number(page) - 1) * Number(limit);

  // Try to get from cache
  const { getOrSet, cacheKeys } = await import('../services/cacheService');
  const cacheKey = cacheKeys.courseList(JSON.stringify(query) + `:${page}:${limit}`);

  const result = await getOrSet(cacheKey, async () => {
    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('modules')
      .select('-versionHistory');

    const total = await Course.countDocuments(query);

    return { courses, total };
  }, 1800); // Cache for 30 minutes

  const courses = result.courses;
  const total = result.total;

  res.json({
    success: true,
    count: courses.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    courses,
  });
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Try to get from cache
  const { getOrSet, cacheKeys } = await import('../services/cacheService');
  const cacheKey = cacheKeys.course(id);

  const course = await getOrSet(cacheKey, async () => {
    return await Course.findById(id)
      .populate('modules')
      .populate('prerequisites')
      .lean();
  }, 3600); // Cache for 1 hour

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  res.json({
    success: true,
    course,
  });
});

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    course,
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  // Track version history if significant changes
  const oldVersion = course.version;
  const updatedCourse = await Course.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  // Increment version if needed
  if (updatedCourse) {
    updatedCourse.version = oldVersion + 1;
    updatedCourse.versionHistory.push({
      version: updatedCourse.version,
      changes: req.body.changes || 'Course updated',
      updatedAt: new Date(),
    });
    await updatedCourse.save();
  }

  res.json({
    success: true,
    message: 'Course updated successfully',
    course: updatedCourse,
  });
});

// @desc    Publish course (with validation)
// @route   POST /api/courses/:id/publish
// @access  Private/Admin
export const publishCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { skipValidation = false } = req.body;

  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  // Run validation unless skipped
  if (!skipValidation) {
    const { validateCourse } = await import('../services/courseValidationService');
    const validation = await validateCourse(id);

    if (!validation.passed) {
      return res.status(400).json({
        success: false,
        message: 'Course validation failed',
        validation,
      });
    }

    // Include warnings even if passed
    if (validation.warnings.length > 0 || validation.brokenLinks.length > 0) {
      return res.status(200).json({
        success: false,
        message: 'Course has warnings but can be published',
        validation,
        canPublish: true,
      });
    }
  }

  // Publish course
  course.status = 'published';
  course.publishedAt = new Date();
  await course.save();

  res.json({
    success: true,
    message: 'Course published successfully',
    course,
  });
});

// @desc    Set course to coming soon
// @route   POST /api/courses/:id/coming-soon
// @access  Private/Admin
export const setComingSoon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const course = await Course.findByIdAndUpdate(
    id,
    { status: 'coming_soon' },
    { new: true }
  );

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  res.json({
    success: true,
    message: 'Course set to coming soon',
    course,
  });
});

// @desc    Start test session
// @route   POST /api/courses/:id/test/start
// @access  Private/Admin
export const startTestSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const { startTestSession } = await import('../services/courseTestModeService');
  const testSession = await startTestSession(userId, id);

  res.json({
    success: true,
    message: 'Test session started',
    testSession,
  });
});

// @desc    Get test session
// @route   GET /api/courses/:id/test
// @access  Private/Admin
export const getTestSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const { getTestSession } = await import('../services/courseTestModeService');
  const testSession = await getTestSession(userId, id);

  if (!testSession) {
    return res.status(404).json({
      success: false,
      message: 'Test session not found. Start a test session first.',
    });
  }

  res.json({
    success: true,
    testSession,
  });
});

// @desc    Validate course
// @route   GET /api/courses/:id/validate
// @access  Private/Admin
export const validateCourseEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { validateCourse } = await import('../services/courseValidationService');
  const validation = await validateCourse(id);

  res.json({
    success: true,
    validation,
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  await course.deleteOne();

  res.json({
    success: true,
    message: 'Course deleted successfully',
  });
});

// @desc    Get user's enrolled courses
// @route   GET /api/courses/enrolled
// @access  Private
export const getEnrolledCourses = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const CourseEnrollment = (await import('../models/CourseEnrollment')).default;
  const enrollments = await CourseEnrollment.find({ user: userId })
    .populate('course')
    .sort({ enrolledAt: -1 });

  const courses = enrollments
    .map((enrollment) => enrollment.course)
    .filter((course) => course !== null);

  res.json({
    success: true,
    courses,
    count: courses.length,
  });
});

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private
export const enrollInCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const course = await Course.findById(id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  // Check if user is already enrolled
  const CourseEnrollment = (await import('../models/CourseEnrollment')).default;
  const existingEnrollment = await CourseEnrollment.findOne({
    user: userId,
    course: id,
  });

  if (existingEnrollment) {
    return res.status(400).json({
      success: false,
      message: 'Already enrolled in this course',
      enrollment: existingEnrollment,
    });
  }

  // Check if course is published
  if (course.status === 'draft') {
    return res.status(400).json({
      success: false,
      message: 'Course is not yet published',
      status: course.status,
    });
  }

  if (course.status === 'coming_soon') {
    return res.status(400).json({
      success: false,
      message: 'Course is coming soon. Please join the waitlist.',
      status: course.status,
      hasWaitlist: course.hasWaitlist,
    });
  }

  if (course.status === 'archived') {
    return res.status(400).json({
      success: false,
      message: 'Course is archived and no longer available for enrollment',
      status: course.status,
    });
  }

  // Check if course is full
  const { isCourseFull, checkAndEnrollNotifiedUser } = await import('../services/courseWaitlistService');
  const full = await isCourseFull(id);

  if (full) {
    // Check if waitlist is enabled
    if (course.hasWaitlist) {
      return res.status(400).json({
        success: false,
        message: 'Course is full. Please join the waitlist.',
        isFull: true,
        hasWaitlist: true,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Course is full',
        isFull: true,
        hasWaitlist: false,
      });
    }
  }

  // Check if user was notified from waitlist
  const wasNotified = await checkAndEnrollNotifiedUser(userId.toString(), id);

  // TODO: Check if user has access (free vs premium)

  // Create enrollment record
  const enrollment = await CourseEnrollment.create({
    user: userId,
    course: id,
    status: 'enrolled',
    enrolledAt: new Date(),
    progressPercentage: 0,
    passThreshold: 70, // Default pass threshold
  });

  // Increment enrollment count
  course.enrollmentCount += 1;
  await course.save();

  res.json({
    success: true,
    message: wasNotified ? 'Successfully enrolled from waitlist' : 'Successfully enrolled in course',
    enrollment,
    fromWaitlist: wasNotified,
  });
});


import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import { IUser } from '../models/User';
import {
  getCourseBundles,
  getCourseBundle,
  purchaseBundle,
  userOwnsBundle,
  getUserBundlePurchases,
  updateBundlePurchaseStatus,
  calculateBundleDiscount,
  orderCoursesByPrerequisites,
  createBundleFromLearningPath,
  getSmartBundleSuggestions,
  getRelatedCourses,
  getCommonlyPurchasedTogether,
  getAIBundleSuggestions,
} from '../services/courseBundleService';
import CourseBundle from '../models/CourseBundle';

// @desc    Get all course bundles
// @route   GET /api/course-bundles
// @access  Public
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const {
    isActive,
    category,
    tags,
    search,
    limit = 20,
    offset = 0,
  } = req.query;

  // Convert tags to string array
  let tagsArray: string[] | undefined;
  if (tags) {
    if (Array.isArray(tags)) {
      tagsArray = tags.map((tag) => String(tag));
    } else {
      tagsArray = [String(tags)];
    }
  }

  const { bundles, total } = await getCourseBundles({
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    category: category as string,
    tags: tagsArray,
    search: search as string,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: bundles.length,
    total,
    bundles,
  });
});

// @desc    Get single course bundle
// @route   GET /api/course-bundles/:id
// @access  Public
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as (IUser & { _id: mongoose.Types.ObjectId }) | undefined;
  const userId = userDoc?._id?.toString();

  const bundle = await getCourseBundle(id);

  if (!bundle) {
    return res.status(404).json({
      success: false,
      message: 'Course bundle not found',
    });
  }

  let ownsBundle = false;
  if (userId) {
    ownsBundle = await userOwnsBundle(userId, id);
  }

  res.json({
    success: true,
    bundle,
    ownsBundle,
  });
});

// @desc    Create course bundle (Admin)
// @route   POST /api/course-bundles
// @access  Private/Admin
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { courses, autoOrder = true, ...bundleData } = req.body;

  // Auto-order courses by prerequisites if requested
  let orderedCourses = courses;
  if (autoOrder && courses && Array.isArray(courses) && courses.length > 1) {
    orderedCourses = await orderCoursesByPrerequisites(courses);
  }

  const bundle = await CourseBundle.create({
    ...bundleData,
    courses: orderedCourses,
  });

  // Calculate discount
  await calculateBundleDiscount(bundle._id.toString());

  const updatedBundle = await CourseBundle.findById(bundle._id)
    .populate('courses', 'title thumbnail difficulty estimatedDuration price isFree');

  res.status(201).json({
    success: true,
    bundle: updatedBundle,
    message: autoOrder ? 'Bundle created with courses ordered by prerequisites' : 'Bundle created',
  });
});

// @desc    Update course bundle (Admin)
// @route   PUT /api/course-bundles/:id
// @access  Private/Admin
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { courses, autoOrder = true, ...updateData } = req.body;
  const bundleId = req.params.id;

  // If courses are being updated, auto-order them by prerequisites
  let orderedCourses = courses;
  if (courses && Array.isArray(courses) && courses.length > 1 && autoOrder) {
    orderedCourses = await orderCoursesByPrerequisites(courses);
  }

  const updatePayload = {
    ...updateData,
    ...(orderedCourses && { courses: orderedCourses }),
  };

  const bundle = await CourseBundle.findByIdAndUpdate(
    bundleId,
    updatePayload,
    {
      new: true,
      runValidators: true,
    }
  ).populate('courses', 'title thumbnail difficulty estimatedDuration price isFree');

  if (!bundle) {
    return res.status(404).json({
      success: false,
      message: 'Course bundle not found',
    });
  }

  // Recalculate discount if courses or price changed
  if (courses || updateData.price) {
    await calculateBundleDiscount(bundle._id.toString());
    const updatedBundle = await CourseBundle.findById(bundle._id)
      .populate('courses', 'title thumbnail difficulty estimatedDuration price isFree');
    return res.json({
      success: true,
      bundle: updatedBundle,
      message: autoOrder && courses ? 'Bundle updated with courses ordered by prerequisites' : 'Bundle updated',
    });
  }

  res.json({
    success: true,
    bundle,
  });
});

// @desc    Delete course bundle (Admin)
// @route   DELETE /api/course-bundles/:id
// @access  Private/Admin
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const bundle = await CourseBundle.findById(req.params.id);

  if (!bundle) {
    return res.status(404).json({
      success: false,
      message: 'Course bundle not found',
    });
  }

  await bundle.deleteOne();

  res.json({
    success: true,
    message: 'Course bundle deleted successfully',
  });
});

// @desc    Purchase bundle
// @route   POST /api/course-bundles/:id/purchase
// @access  Private
export const purchase = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { stripePaymentIntentId, paymentStatus } = req.body;

  try {
    const purchase = await purchaseBundle(userId, id, {
      stripePaymentIntentId,
      paymentStatus: paymentStatus || 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Bundle purchase initiated',
      purchase,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to purchase bundle',
    });
  }
});

// @desc    Check if user owns bundle
// @route   GET /api/course-bundles/:id/owns
// @access  Private
export const checkOwnership = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const owns = await userOwnsBundle(userId, id);

  res.json({
    success: true,
    owns,
  });
});

// @desc    Get user's bundle purchases
// @route   GET /api/course-bundles/user/purchases
// @access  Private
export const getUserPurchases = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { limit = 50, offset = 0 } = req.query;

  const { purchases, total } = await getUserBundlePurchases(userId, {
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: purchases.length,
    total,
    purchases,
  });
});

// @desc    Update bundle purchase status (for webhooks)
// @route   PUT /api/course-bundles/purchases/:id/status
// @access  Private/Admin or Webhook
export const updatePurchaseStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  if (!paymentStatus || !['pending', 'completed', 'failed', 'refunded'].includes(paymentStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Valid paymentStatus is required',
    });
  }

  const purchase = await updateBundlePurchaseStatus(id, paymentStatus);

  if (!purchase) {
    return res.status(404).json({
      success: false,
      message: 'Bundle purchase not found',
    });
  }

  res.json({
    success: true,
    message: 'Purchase status updated',
    purchase,
  });
});

// @desc    Create bundle from learning path (Admin)
// @route   POST /api/course-bundles/from-learning-path/:pathId
// @access  Private/Admin
export const createFromLearningPath = asyncHandler(async (req: Request, res: Response) => {
  const { pathId } = req.params;
  const { name, description, price, discountPercentage } = req.body;

  try {
    const bundle = await createBundleFromLearningPath(pathId, {
      name,
      description,
      price,
      discountPercentage,
    });

    const populatedBundle = await CourseBundle.findById(bundle._id)
      .populate('courses', 'title thumbnail difficulty estimatedDuration price isFree');

    res.status(201).json({
      success: true,
      bundle: populatedBundle,
      message: 'Bundle created from learning path',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create bundle from learning path',
    });
  }
});

// @desc    Get smart bundle suggestions for a course
// @route   GET /api/course-bundles/suggestions/:courseId
// @access  Public
export const getSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  const suggestions = await getSmartBundleSuggestions(courseId);

  res.json({
    success: true,
    suggestions,
  });
});

// @desc    Get related courses
// @route   GET /api/course-bundles/related/:courseId
// @access  Public
export const getRelated = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { limit = 5 } = req.query;

  const relatedCourses = await getRelatedCourses(courseId, Number(limit));

  res.json({
    success: true,
    courses: relatedCourses,
  });
});

// @desc    Get commonly purchased together courses
// @route   GET /api/course-bundles/commonly-purchased/:courseId
// @access  Public
export const getCommonlyPurchased = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { limit = 5 } = req.query;

  const commonlyPurchased = await getCommonlyPurchasedTogether(courseId, Number(limit));

  res.json({
    success: true,
    courses: commonlyPurchased,
  });
});

// @desc    Get AI bundle suggestions
// @route   POST /api/course-bundles/ai-suggestions
// @access  Public
export const getAISuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { courseIds, maxCourses, category, difficulty } = req.body;

  if (!courseIds || !Array.isArray(courseIds)) {
    return res.status(400).json({
      success: false,
      message: 'courseIds array is required',
    });
  }

  const suggestions = await getAIBundleSuggestions(courseIds, {
    maxCourses,
    category,
    difficulty,
  });

  res.json({
    success: true,
    suggestions,
  });
});

// @desc    Order courses by prerequisites
// @route   POST /api/course-bundles/order-courses
// @access  Private/Admin
export const orderCourses = asyncHandler(async (req: Request, res: Response) => {
  const { courseIds } = req.body;

  if (!courseIds || !Array.isArray(courseIds)) {
    return res.status(400).json({
      success: false,
      message: 'courseIds array is required',
    });
  }

  const orderedCourses = await orderCoursesByPrerequisites(courseIds);

  res.json({
    success: true,
    originalOrder: courseIds,
    orderedCourses,
  });
});


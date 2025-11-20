import CourseBundle, { ICourseBundle } from '../models/CourseBundle';
import BundlePurchase, { IBundlePurchase } from '../models/BundlePurchase';
import Course, { ICourse } from '../models/Course';
import CourseEnrollment from '../models/CourseEnrollment';
import LearningPath from '../models/LearningPath';
import logger from '../utils/logger';

/**
 * Calculate bundle discount
 */
export const calculateBundleDiscount = async (
  bundleId: string
): Promise<{ originalPrice: number; discountPercentage: number }> => {
  try {
    const bundle = await CourseBundle.findById(bundleId).populate('courses');
    if (!bundle) {
      throw new Error('Bundle not found');
    }

    const courses = bundle.courses as any[];
    let originalPrice = 0;

    for (const course of courses) {
      if (course.isFree) {
        continue; // Free courses don't count toward original price
      }
      originalPrice += course.price || 0;
    }

    const discountPercentage = originalPrice > 0
      ? Math.round(((originalPrice - bundle.price) / originalPrice) * 100)
      : 0;

    // Update bundle with calculated values
    bundle.originalPrice = originalPrice;
    bundle.discountPercentage = discountPercentage;
    await bundle.save();

    return { originalPrice, discountPercentage };
  } catch (error) {
    logger.error('Error calculating bundle discount:', error);
    throw error;
  }
};

/**
 * Get all course bundles
 */
export const getCourseBundles = async (
  options?: {
    isActive?: boolean;
    category?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ bundles: ICourseBundle[]; total: number }> => {
  try {
    const query: any = {};

    if (options?.isActive !== undefined) {
      query.isActive = options.isActive;
    } else {
      query.isActive = true;
    }

    // Default to public bundles only
    query.isPublic = true;

    if (options?.category) {
      query.category = options.category;
    }

    if (options?.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }

    if (options?.search) {
      query.$text = { $search: options.search };
    }

    // Check date ranges for active bundles
    const now = new Date();
    query.$or = [
      { startDate: { $exists: false } },
      { startDate: { $lte: now } },
    ];
    query.$and = [
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: { $gte: now } },
        ],
      },
    ];

    const total = await CourseBundle.countDocuments(query);

    const bundles = await CourseBundle.find(query)
      .populate('courses', 'title thumbnail difficulty estimatedDuration price isFree')
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 20);

    return { bundles, total };
  } catch (error) {
    logger.error('Error getting course bundles:', error);
    return { bundles: [], total: 0 };
  }
};

/**
 * Get single course bundle
 */
export const getCourseBundle = async (
  bundleId: string
): Promise<ICourseBundle | null> => {
  try {
    const bundle = await CourseBundle.findById(bundleId)
      .populate('courses', 'title description thumbnail difficulty estimatedDuration price isFree category tags');

    if (bundle) {
      // Calculate discount if not already set
      if (!bundle.originalPrice || !bundle.discountPercentage) {
        await calculateBundleDiscount(bundleId);
        return await CourseBundle.findById(bundleId)
          .populate('courses', 'title description thumbnail difficulty estimatedDuration price isFree category tags');
      }
    }

    return bundle;
  } catch (error) {
    logger.error('Error getting course bundle:', error);
    return null;
  }
};

/**
 * Purchase bundle
 */
export const purchaseBundle = async (
  userId: string,
  bundleId: string,
  paymentData?: {
    stripePaymentIntentId?: string;
    paymentStatus?: 'pending' | 'completed' | 'failed';
  }
): Promise<IBundlePurchase> => {
  try {
    const bundle = await CourseBundle.findById(bundleId);
    if (!bundle) {
      throw new Error('Bundle not found');
    }

    if (!bundle.isActive) {
      throw new Error('Bundle is not active');
    }

    // Check if already purchased
    const existingPurchase = await BundlePurchase.findOne({
      user: userId,
      bundle: bundleId,
    });

    if (existingPurchase && existingPurchase.paymentStatus === 'completed') {
      throw new Error('Bundle already purchased');
    }

    // Create or update purchase
    let purchase;
    if (existingPurchase) {
      purchase = existingPurchase;
      purchase.price = bundle.price;
      purchase.currency = bundle.currency;
      purchase.discountAmount = bundle.originalPrice
        ? bundle.originalPrice - bundle.price
        : 0;
      if (paymentData?.stripePaymentIntentId) {
        purchase.stripePaymentIntentId = paymentData.stripePaymentIntentId;
      }
      if (paymentData?.paymentStatus) {
        purchase.paymentStatus = paymentData.paymentStatus;
      }
    } else {
      purchase = await BundlePurchase.create({
        user: userId,
        bundle: bundleId,
        price: bundle.price,
        currency: bundle.currency,
        discountAmount: bundle.originalPrice
          ? bundle.originalPrice - bundle.price
          : 0,
        stripePaymentIntentId: paymentData?.stripePaymentIntentId,
        paymentStatus: paymentData?.paymentStatus || 'pending',
      });
    }

    // If payment is completed, enroll user in all courses
    if (purchase.paymentStatus === 'completed' && !purchase.enrolledAt) {
      await enrollUserInBundleCourses(userId, bundleId);
      purchase.enrolledAt = new Date();
      purchase.coursesEnrolled = bundle.courses as any;
      await purchase.save();

      // Update bundle statistics
      bundle.salesCount += 1;
      bundle.enrollmentCount += 1;
      await bundle.save();
    }

    logger.info(`Bundle purchase: ${bundleId} by user ${userId}`);
    return purchase;
  } catch (error) {
    logger.error('Error purchasing bundle:', error);
    throw error;
  }
};

/**
 * Enroll user in all bundle courses
 */
const enrollUserInBundleCourses = async (
  userId: string,
  bundleId: string
): Promise<void> => {
  try {
    const bundle = await CourseBundle.findById(bundleId);
    if (!bundle) {
      return;
    }

    for (const courseId of bundle.courses) {
      // Check if already enrolled
      const existingEnrollment = await CourseEnrollment.findOne({
        user: userId,
        course: courseId,
      });

      if (!existingEnrollment) {
        // Create enrollment
        await CourseEnrollment.create({
          user: userId,
          course: courseId,
          status: 'enrolled',
          enrolledAt: new Date(),
          progressPercentage: 0,
          passThreshold: 70,
        });

        // Increment course enrollment count
        const course = await Course.findById(courseId);
        if (course) {
          course.enrollmentCount += 1;
          await course.save();
        }
      }
    }
  } catch (error) {
    logger.error('Error enrolling user in bundle courses:', error);
    throw error;
  }
};

/**
 * Check if user owns bundle
 */
export const userOwnsBundle = async (
  userId: string,
  bundleId: string
): Promise<boolean> => {
  try {
    const purchase = await BundlePurchase.findOne({
      user: userId,
      bundle: bundleId,
      paymentStatus: 'completed',
    });
    return !!purchase;
  } catch (error) {
    logger.error('Error checking bundle ownership:', error);
    return false;
  }
};

/**
 * Get user's bundle purchases
 */
export const getUserBundlePurchases = async (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ purchases: IBundlePurchase[]; total: number }> => {
  try {
    const total = await BundlePurchase.countDocuments({
      user: userId,
      paymentStatus: 'completed',
    });

    const purchases = await BundlePurchase.find({
      user: userId,
      paymentStatus: 'completed',
    })
      .populate('bundle', 'name description thumbnail courses')
      .sort({ purchasedAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { purchases, total };
  } catch (error) {
    logger.error('Error getting user bundle purchases:', error);
    return { purchases: [], total: 0 };
  }
};

/**
 * Update bundle purchase payment status
 */
export const updateBundlePurchaseStatus = async (
  purchaseId: string,
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
): Promise<IBundlePurchase | null> => {
  try {
    const purchase = await BundlePurchase.findById(purchaseId).populate('bundle');
    if (!purchase) {
      return null;
    }

    const oldStatus = purchase.paymentStatus;
    purchase.paymentStatus = paymentStatus;

    // If payment completed, enroll user in courses
    if (paymentStatus === 'completed' && oldStatus !== 'completed') {
      const bundle = purchase.bundle as any;
      await enrollUserInBundleCourses(purchase.user.toString(), bundle._id.toString());
      purchase.enrolledAt = new Date();
      purchase.coursesEnrolled = bundle.courses;

      // Update bundle statistics
      bundle.salesCount += 1;
      bundle.enrollmentCount += 1;
      await bundle.save();
    }

    await purchase.save();
    return purchase;
  } catch (error) {
    logger.error('Error updating bundle purchase status:', error);
    throw error;
  }
};

/**
 * Order courses by prerequisites (topological sort)
 * Ensures prerequisites come before dependent courses
 */
export const orderCoursesByPrerequisites = async (
  courseIds: string[]
): Promise<string[]> => {
  try {
    const courses = await Course.find({ _id: { $in: courseIds } });
    
    // Build dependency graph
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    // Initialize
    courseIds.forEach(id => {
      graph.set(id, []);
      inDegree.set(id, 0);
    });
    
    // Build edges (prerequisites -> course)
    courses.forEach(course => {
      const courseId = course._id.toString();
      course.prerequisites.forEach((prereqId: any) => {
        const prereqIdStr = prereqId.toString();
        if (courseIds.includes(prereqIdStr)) {
          graph.get(prereqIdStr)!.push(courseId);
          inDegree.set(courseId, (inDegree.get(courseId) || 0) + 1);
        }
      });
    });
    
    // Topological sort (Kahn's algorithm)
    const queue: string[] = [];
    const result: string[] = [];
    
    // Find all courses with no prerequisites
    inDegree.forEach((degree, courseId) => {
      if (degree === 0) {
        queue.push(courseId);
      }
    });
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      const dependents = graph.get(current) || [];
      dependents.forEach(dependent => {
        const newDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          queue.push(dependent);
        }
      });
    }
    
    // If we couldn't process all courses, there's a cycle
    // In that case, return original order but log warning
    if (result.length !== courseIds.length) {
      logger.warn('Circular dependency detected in course prerequisites, using original order');
      return courseIds;
    }
    
    // Add any courses not in the result (shouldn't happen, but safety check)
    courseIds.forEach(id => {
      if (!result.includes(id)) {
        result.push(id);
      }
    });
    
    return result;
  } catch (error) {
    logger.error('Error ordering courses by prerequisites:', error);
    return courseIds; // Return original order on error
  }
};

/**
 * Convert learning path to bundle
 */
export const createBundleFromLearningPath = async (
  learningPathId: string,
  bundleData?: {
    name?: string;
    description?: string;
    price?: number;
    discountPercentage?: number;
  }
): Promise<ICourseBundle> => {
  try {
    const path = await LearningPath.findById(learningPathId);
    if (!path) {
      throw new Error('Learning path not found');
    }
    
    // Get courses in order
    const orderedCourses = path.courses
      .sort((a, b) => a.order - b.order)
      .map(item => item.course);
    
    // Calculate pricing
    const courses = await Course.find({ _id: { $in: orderedCourses } });
    let originalPrice = 0;
    courses.forEach(course => {
      if (!course.isFree) {
        originalPrice += course.price || 0;
      }
    });
    
    // Calculate bundle price
    let bundlePrice = originalPrice;
    if (bundleData?.price) {
      bundlePrice = bundleData.price;
    } else if (bundleData?.discountPercentage) {
      bundlePrice = originalPrice * (1 - bundleData.discountPercentage / 100);
    } else {
      // Default 20% discount
      bundlePrice = originalPrice * 0.8;
    }
    
    const discountPercentage = originalPrice > 0
      ? Math.round(((originalPrice - bundlePrice) / originalPrice) * 100)
      : 0;
    
    // Create bundle
    const bundle = await CourseBundle.create({
      name: bundleData?.name || `${path.name} Bundle`,
      description: bundleData?.description || path.description || `Complete bundle for ${path.name}`,
      courses: orderedCourses,
      price: Math.round(bundlePrice * 100) / 100, // Round to 2 decimals
      currency: 'USD',
      originalPrice: Math.round(originalPrice * 100) / 100,
      discountPercentage,
      tags: path.tags || [],
      category: path.category,
      thumbnail: path.thumbnail,
      isActive: path.isActive,
      isPublic: path.isPublic,
    });
    
    logger.info(`Created bundle from learning path: ${learningPathId} -> ${bundle._id}`);
    return bundle;
  } catch (error) {
    logger.error('Error creating bundle from learning path:', error);
    throw error;
  }
};

/**
 * Get related courses based on tags and categories
 */
export const getRelatedCourses = async (
  courseId: string,
  limit: number = 5
): Promise<ICourse[]> => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return [];
    }
    
    // Find courses with similar tags or same category
    const relatedCourses = await Course.find({
      _id: { $ne: courseId },
      status: 'published',
      $or: [
        { tags: { $in: course.tags } },
        { category: course.category },
      ],
    })
      .sort({ enrollmentCount: -1, averageRating: -1 })
      .limit(limit);
    
    return relatedCourses;
  } catch (error) {
    logger.error('Error getting related courses:', error);
    return [];
  }
};

/**
 * Get courses commonly purchased together
 */
export const getCommonlyPurchasedTogether = async (
  courseId: string,
  limit: number = 5
): Promise<{ course: ICourse; count: number }[]> => {
  try {
    // Get all bundles that contain this course
    const bundles = await CourseBundle.find({
      courses: courseId,
      isActive: true,
    });
    
    // Count how many times each other course appears in bundles with this course
    const courseCounts = new Map<string, number>();
    
    for (const bundle of bundles) {
      bundle.courses.forEach((otherCourseId: any) => {
        const otherId = otherCourseId.toString();
        if (otherId !== courseId) {
          courseCounts.set(otherId, (courseCounts.get(otherId) || 0) + 1);
        }
      });
    }
    
    // Sort by count and get top courses
    const sortedCourses = Array.from(courseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    
    // Get course details
    const courseIds = sortedCourses.map(([id]) => id);
    const courses = await Course.find({ _id: { $in: courseIds } });
    
    // Map back with counts
    const result = sortedCourses.map(([id, count]) => {
      const course = courses.find(c => c._id.toString() === id);
      return { course: course!, count };
    }).filter(item => item.course);
    
    return result as { course: ICourse; count: number }[];
  } catch (error) {
    logger.error('Error getting commonly purchased together courses:', error);
    return [];
  }
};

/**
 * Get AI-powered bundle suggestions
 */
export const getAIBundleSuggestions = async (
  courseIds: string[],
  options?: {
    maxCourses?: number;
    category?: string;
    difficulty?: string;
  }
): Promise<{
  suggestedCourses: ICourse[];
  reasoning: string;
}> => {
  try {
    // Get the courses
    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length === 0) {
      return { suggestedCourses: [], reasoning: 'No courses found' };
    }
    
    // Analyze common characteristics
    const allTags = new Set<string>();
    const categories = new Set<string>();
    const difficulties = new Set<string>();
    
    courses.forEach(course => {
      course.tags.forEach(tag => allTags.add(tag));
      categories.add(course.category);
      difficulties.add(course.difficulty);
    });
    
    // Find courses that share characteristics but aren't already in the bundle
    const query: any = {
      _id: { $nin: courseIds },
      status: 'published',
      $or: [
        { tags: { $in: Array.from(allTags) } },
        { category: { $in: Array.from(categories) } },
      ],
    };
    
    if (options?.category) {
      query.category = options.category;
    }
    
    if (options?.difficulty) {
      query.difficulty = options.difficulty;
    }
    
    const suggestedCourses = await Course.find(query)
      .sort({ enrollmentCount: -1, averageRating: -1 })
      .limit(options?.maxCourses || 5);
    
    const reasoning = `Suggested based on shared tags (${Array.from(allTags).slice(0, 3).join(', ')}) and categories (${Array.from(categories).join(', ')})`;
    
    return { suggestedCourses, reasoning };
  } catch (error) {
    logger.error('Error getting AI bundle suggestions:', error);
    return { suggestedCourses: [], reasoning: 'Error generating suggestions' };
  }
};

/**
 * Get smart bundle suggestions for a course
 */
export const getSmartBundleSuggestions = async (
  courseId: string
): Promise<{
  relatedCourses: ICourse[];
  commonlyPurchased: { course: ICourse; count: number }[];
  aiSuggestions: { suggestedCourses: ICourse[]; reasoning: string };
}> => {
  try {
    const [relatedCourses, commonlyPurchased, aiSuggestions] = await Promise.all([
      getRelatedCourses(courseId, 5),
      getCommonlyPurchasedTogether(courseId, 5),
      getAIBundleSuggestions([courseId], { maxCourses: 5 }),
    ]);
    
    return {
      relatedCourses,
      commonlyPurchased,
      aiSuggestions,
    };
  } catch (error) {
    logger.error('Error getting smart bundle suggestions:', error);
    return {
      relatedCourses: [],
      commonlyPurchased: [],
      aiSuggestions: { suggestedCourses: [], reasoning: '' },
    };
  }
};


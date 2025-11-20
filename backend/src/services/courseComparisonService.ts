import Course from '../models/Course';
import CourseReview from '../models/CourseReview';
import CourseEnrollment from '../models/CourseEnrollment';
import CourseCompletion from '../models/CourseCompletion';
import logger from '../utils/logger';

interface CourseComparisonItem {
  course: {
    _id: any;
    title: string;
    description: string;
    courseType: string;
    difficulty: string;
    estimatedDuration: number;
    tags: string[];
    category?: string;
    thumbnail?: string;
    isFree: boolean;
    price?: number;
    currency?: string;
  };
  statistics: {
    enrollmentCount: number;
    completionCount: number;
    passCount: number;
    reviewCount: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    averageDifficulty: number | null;
    completionRate: number;
    totalModules: number;
    totalLessons: number;
    totalAssignments: number;
  };
}

/**
 * Compare multiple courses
 */
export const compareCourses = async (
  courseIds: string[]
): Promise<any> => {
  try {
    if (courseIds.length < 2) {
      throw new Error('At least 2 courses are required for comparison');
    }

    if (courseIds.length > 5) {
      throw new Error('Maximum 5 courses can be compared at once');
    }

    // Get all courses
    const courses = await Course.find({
      _id: { $in: courseIds },
      status: 'published',
    })
      .populate('modules')
      .select('-versionHistory');

    if (courses.length !== courseIds.length) {
      throw new Error('One or more courses not found');
    }

    // Get statistics for each course
    const courseComparisons = await Promise.all(
      courses.map(async (course) => {
        // Get review statistics
        const reviews = await CourseReview.find({
          course: course._id,
          isPublic: true,
          isApproved: true,
        });

        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((r) => {
          ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
        });

        // Get difficulty ratings
        const difficultyRatings = reviews
          .filter((r) => r.difficultyRating)
          .map((r) => r.difficultyRating!);
        const averageDifficulty = difficultyRatings.length > 0
          ? difficultyRatings.reduce((sum, r) => sum + r, 0) / difficultyRatings.length
          : null;

        // Get completion statistics
        const totalEnrollments = await CourseEnrollment.countDocuments({
          course: course._id,
        });

        const totalCompletions = await CourseCompletion.countDocuments({
          course: course._id,
          passed: true,
        });

        const completionRate = totalEnrollments > 0
          ? Math.round((totalCompletions / totalEnrollments) * 100)
          : 0;

        // Count modules and lessons
        const Module = (await import('../models/Module')).default;
        const Lesson = (await import('../models/Lesson')).default;
        const Assignment = (await import('../models/Assignment')).default;

        const modules = await Module.find({ _id: { $in: course.modules } });
        let totalLessons = 0;
        let totalAssignments = 0;

        for (const module of modules) {
          const lessons = await Lesson.find({ module: module._id });
          totalLessons += lessons.length;

          for (const lesson of lessons) {
            const assignments = await Assignment.find({ lesson: lesson._id });
            totalAssignments += assignments.length;
          }
        }

        return {
          course: {
            _id: course._id,
            title: course.title,
            description: course.description,
            courseType: course.courseType,
            difficulty: course.difficulty,
            estimatedDuration: course.estimatedDuration,
            tags: course.tags,
            category: course.category,
            thumbnail: course.thumbnail,
            isFree: course.isFree,
            price: course.price,
            currency: course.currency,
          },
          statistics: {
            enrollmentCount: course.enrollmentCount,
            completionCount: course.completionCount,
            passCount: course.passCount,
            reviewCount: reviews.length,
            averageRating: Math.round(averageRating * 10) / 10,
            ratingDistribution,
            averageDifficulty: averageDifficulty ? Math.round(averageDifficulty * 10) / 10 : null,
            completionRate,
            totalModules: modules.length,
            totalLessons,
            totalAssignments,
          },
        };
      })
    );

    // Calculate comparison metrics
    const comparison = {
      courses: courseComparisons,
      metrics: {
        cheapest: courseComparisons.reduce((min, c) => {
          if (c.course.isFree) return min;
          if (min.course.isFree) return c;
          return (c.course.price || 0) < (min.course.price || 0) ? c : min;
        }, courseComparisons[0]),
        mostRated: courseComparisons.reduce((max, c) =>
          c.statistics.reviewCount > max.statistics.reviewCount ? c : max
        , courseComparisons[0]),
        highestRated: courseComparisons.reduce((max, c) =>
          c.statistics.averageRating > max.statistics.averageRating ? c : max
        , courseComparisons[0]),
        highestCompletionRate: courseComparisons.reduce((max, c) =>
          c.statistics.completionRate > max.statistics.completionRate ? c : max
        , courseComparisons[0]),
        longest: courseComparisons.reduce((max, c) =>
          c.course.estimatedDuration > max.course.estimatedDuration ? c : max
        , courseComparisons[0]),
        shortest: courseComparisons.reduce((min, c) =>
          c.course.estimatedDuration < min.course.estimatedDuration ? c : min
        , courseComparisons[0]),
      },
    };

    return comparison;
  } catch (error) {
    logger.error('Error comparing courses:', error);
    throw error;
  }
};

/**
 * Get comparison summary
 */
export const getComparisonSummary = async (
  courseIds: string[]
): Promise<any> => {
  try {
    const comparison = await compareCourses(courseIds);

    const paidCourses = comparison.courses.filter((c: CourseComparisonItem) => !c.course.isFree);
    const paidPrices = paidCourses.map((c: CourseComparisonItem) => c.course.price || 0);

    const summary = {
      totalCourses: comparison.courses.length,
      priceRange: {
        min: paidPrices.length > 0 ? Math.min(...paidPrices) : 0,
        max: paidPrices.length > 0 ? Math.max(...paidPrices) : 0,
        freeCount: comparison.courses.filter((c: CourseComparisonItem) => c.course.isFree).length,
      },
      ratingRange: {
        min: Math.min(...comparison.courses.map((c: CourseComparisonItem) => c.statistics.averageRating)),
        max: Math.max(...comparison.courses.map((c: CourseComparisonItem) => c.statistics.averageRating)),
      },
      durationRange: {
        min: Math.min(...comparison.courses.map((c: CourseComparisonItem) => c.course.estimatedDuration)),
        max: Math.max(...comparison.courses.map((c: CourseComparisonItem) => c.course.estimatedDuration)),
      },
      totalEnrollments: comparison.courses.reduce(
        (sum: number, c: CourseComparisonItem) => sum + c.statistics.enrollmentCount,
        0
      ),
      totalReviews: comparison.courses.reduce(
        (sum: number, c: CourseComparisonItem) => sum + c.statistics.reviewCount,
        0
      ),
      courseTypes: [...new Set(comparison.courses.map((c: CourseComparisonItem) => c.course.courseType))],
      difficulties: [...new Set(comparison.courses.map((c: CourseComparisonItem) => c.course.difficulty))],
      categories: [...new Set(comparison.courses.map((c: CourseComparisonItem) => c.course.category).filter(Boolean))],
    };

    return {
      comparison,
      summary,
    };
  } catch (error) {
    logger.error('Error getting comparison summary:', error);
    throw error;
  }
};


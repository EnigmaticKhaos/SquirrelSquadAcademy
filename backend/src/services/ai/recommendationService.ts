import OpenAI from 'openai';
import { config } from '../../config/env';
import User from '../../models/User';
import Course from '../../models/Course';
import CourseEnrollment from '../../models/CourseEnrollment';
import CourseCompletion from '../../models/CourseCompletion';
import CourseReview from '../../models/CourseReview';
import LearningPath from '../../models/LearningPath';
import logger from '../../utils/logger';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Get AI-powered course recommendations for a user
 */
export const getCourseRecommendations = async (
  userId: string,
  options?: {
    limit?: number;
    excludeEnrolled?: boolean;
  }
): Promise<Array<{
  course: any;
  reason: string;
  matchScore: number;
}>> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's learning history
    const enrollments = await CourseEnrollment.find({ user: userId })
      .populate('course');
    const completions = await CourseEnrollment.find({ user: userId, status: 'completed' })
      .populate('course');
    const reviews = await CourseReview.find({ user: userId })
      .populate('course');

    // Get user's interests from completed courses
    const completedCourseIds = completions.map(c => c.course.toString());
    const completedCourses = await Course.find({ _id: { $in: completedCourseIds } });
    const courseTags = new Set<string>();
    completedCourses.forEach(course => {
      if (course.tags) {
        course.tags.forEach(tag => courseTags.add(tag));
      }
    });

    // Get all available courses
    const enrolledCourseIds = enrollments.map(e => e.course.toString());
    const query: any = { status: 'published' };
    if (options?.excludeEnrolled) {
      query._id = { $nin: enrolledCourseIds };
    }

    const availableCourses = await Course.find(query)
      .select('title description tags difficulty level courseType price thumbnail')
      .limit(100); // Limit for AI processing

    if (availableCourses.length === 0) {
      return [];
    }

    // Build context for AI
    const userContext = {
      completedCourses: completedCourses.map(c => ({
        title: c.title,
        tags: c.tags || [],
        difficulty: c.difficulty,
      })),
      interests: Array.from(courseTags),
      reviews: reviews.map(r => ({
        courseTitle: (r.course as any)?.title,
        rating: r.rating,
      })),
    };

    const coursesContext = availableCourses.map(c => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      tags: c.tags || [],
      difficulty: c.difficulty,
      level: c.level,
      courseType: c.courseType,
      price: c.price,
    }));

    // Call OpenAI for recommendations
    const prompt = `Based on the following user learning history and available courses, recommend courses that would be most beneficial for the user.

User Learning History:
- Completed Courses: ${JSON.stringify(userContext.completedCourses)}
- Interests/Tags: ${JSON.stringify(userContext.interests)}
- Reviews: ${JSON.stringify(userContext.reviews)}

Available Courses:
${JSON.stringify(coursesContext)}

Please recommend courses that:
1. Build upon the user's completed courses
2. Match their interests
3. Are appropriate for their skill level
4. Offer good value based on their review patterns

Return a JSON array of course recommendations with this format:
[
  {
    "courseId": "course_id",
    "reason": "Why this course is recommended",
    "matchScore": 0.95
  }
]

Order by matchScore descending. Return top ${options?.limit || 10} recommendations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert learning advisor. Provide personalized course recommendations based on user learning history and preferences. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    let recommendations: Array<{ courseId: string; reason: string; matchScore: number }>;
    try {
      // Extract JSON from response (might have markdown code blocks)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = JSON.parse(aiResponse);
      }
    } catch (error) {
      logger.error('Error parsing AI recommendations:', error);
      // Fallback to simple tag-based recommendations
      return getFallbackRecommendations(userId, availableCourses, courseTags, options?.limit || 10);
    }

    // Get full course details
    const recommendedCourseIds = recommendations.map(r => r.courseId);
    const recommendedCourses = await Course.find({ _id: { $in: recommendedCourseIds } })
      .populate('instructor', 'username profilePhoto');

    // Map recommendations with course details
    const result = recommendations
      .map(rec => {
        const course = recommendedCourses.find(c => c._id.toString() === rec.courseId);
        if (!course) return null;

        return {
          course,
          reason: rec.reason,
          matchScore: rec.matchScore || 0.5,
        };
      })
      .filter(Boolean) as any[];

    return result.slice(0, options?.limit || 10);
  } catch (error) {
    logger.error('Error getting AI course recommendations:', error);
    // Fallback to simple recommendations
    const enrollments = await CourseEnrollment.find({ user: userId }).populate('course');
    const enrolledCourseIds = enrollments.map(e => e.course.toString());
    const query: any = { status: 'published' };
    if (options?.excludeEnrolled) {
      query._id = { $nin: enrolledCourseIds };
    }
    const courses = await Course.find(query).limit(options?.limit || 10);
    return courses.map(course => ({
      course,
      reason: 'Recommended based on your learning journey',
      matchScore: 0.5,
    }));
  }
};

/**
 * Fallback recommendations based on tags
 */
const getFallbackRecommendations = async (
  userId: string,
  availableCourses: any[],
  userTags: Set<string>,
  limit: number
): Promise<Array<{ course: any; reason: string; matchScore: number }>> => {
  // Score courses based on tag overlap
  const scoredCourses = availableCourses.map(course => {
    const courseTags = new Set(course.tags || []);
    const overlap = new Set([...userTags].filter(tag => courseTags.has(tag)));
    const matchScore = overlap.size / Math.max(userTags.size, 1);

    return {
      course,
      reason: `Matches your interests in: ${Array.from(overlap).join(', ')}`,
      matchScore,
    };
  });

  return scoredCourses
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
};

/**
 * Get AI-powered learning path recommendations
 */
export const getLearningPathRecommendations = async (
  userId: string,
  options?: {
    limit?: number;
  }
): Promise<Array<{
  learningPath: any;
  reason: string;
  matchScore: number;
}>> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's learning history
    const completions = await CourseCompletion.find({ user: userId })
      .populate('course');
    const enrollments = await CourseEnrollment.find({ user: userId })
      .populate('course');

    const completedCourseIds = completions.map(c => c.course.toString());
    const enrolledCourseIds = enrollments.map(e => e.course.toString());

    // Get all learning paths
    const learningPaths = await LearningPath.find({ isPublished: true })
      .populate('courses')
      .limit(50);

    if (learningPaths.length === 0) {
      return [];
    }

    // Build context for AI
    const userContext = {
      completedCourses: completedCourseIds,
      enrolledCourses: enrolledCourseIds,
      completedCourseTitles: completions.map(c => (c.course as any)?.title),
    };

    const pathsContext = learningPaths.map(path => ({
      id: path._id.toString(),
      title: path.title,
      description: path.description,
      courseIds: (path.courses as any[]).map(c => c._id.toString()),
      courseTitles: (path.courses as any[]).map(c => c.title),
      difficulty: path.difficulty,
      estimatedDuration: path.estimatedDuration,
    }));

    // Call OpenAI for recommendations
    const prompt = `Based on the following user learning history and available learning paths, recommend learning paths that would be most beneficial.

User Learning History:
- Completed Courses: ${JSON.stringify(userContext.completedCourseTitles)}
- Completed Course IDs: ${JSON.stringify(userContext.completedCourses)}

Available Learning Paths:
${JSON.stringify(pathsContext)}

Please recommend learning paths that:
1. Build upon the user's completed courses
2. Help them achieve their learning goals
3. Are appropriate for their skill level
4. Have courses they haven't completed yet

Return a JSON array of learning path recommendations with this format:
[
  {
    "pathId": "path_id",
    "reason": "Why this path is recommended",
    "matchScore": 0.95
  }
]

Order by matchScore descending. Return top ${options?.limit || 5} recommendations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert learning advisor. Provide personalized learning path recommendations. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    let recommendations: Array<{ pathId: string; reason: string; matchScore: number }>;
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = JSON.parse(aiResponse);
      }
    } catch (error) {
      logger.error('Error parsing AI learning path recommendations:', error);
      // Fallback
      return learningPaths.slice(0, options?.limit || 5).map(path => ({
        learningPath: path,
        reason: 'Recommended learning path for your skill level',
        matchScore: 0.5,
      }));
    }

    // Get full learning path details
    const recommendedPathIds = recommendations.map(r => r.pathId);
    const recommendedPaths = learningPaths.filter(p => 
      recommendedPathIds.includes(p._id.toString())
    );

    // Map recommendations
    const result = recommendations
      .map(rec => {
        const path = recommendedPaths.find(p => p._id.toString() === rec.pathId);
        if (!path) return null;

        return {
          learningPath: path,
          reason: rec.reason,
          matchScore: rec.matchScore || 0.5,
        };
      })
      .filter(Boolean) as any[];

    return result.slice(0, options?.limit || 5);
  } catch (error) {
    logger.error('Error getting AI learning path recommendations:', error);
    return [];
  }
};

/**
 * Get AI-powered pricing suggestions for a course
 */
export const getPricingSuggestion = async (
  courseId: string
): Promise<{
  suggestedPrice: number;
  reasoning: string;
  priceRange: {
    min: number;
    max: number;
    recommended: number;
  };
}> => {
  try {
    const course = await Course.findById(courseId)
      .populate('instructor', 'username');
    
    if (!course) {
      throw new Error('Course not found');
    }

    // Get similar courses for price comparison
    const similarCourses = await Course.find({
      status: 'published',
      courseType: course.courseType,
      difficulty: course.difficulty,
      _id: { $ne: courseId },
    })
      .select('title price duration difficulty level')
      .limit(20);

    // Get course statistics
    const enrollmentCount = await CourseEnrollment.countDocuments({ course: courseId });
    const completionCount = await CourseCompletion.countDocuments({ course: courseId });
    const reviews = await CourseReview.find({ course: courseId });
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Build context for AI
    const context = {
      course: {
        title: course.title,
        description: course.description,
        duration: course.duration,
        difficulty: course.difficulty,
        level: course.level,
        courseType: course.courseType,
        currentPrice: course.price,
        modules: course.modules?.length || 0,
      },
      statistics: {
        enrollmentCount,
        completionCount,
        averageRating,
        reviewCount: reviews.length,
      },
      similarCourses: similarCourses.map(c => ({
        title: c.title,
        price: c.price,
        duration: c.duration,
        difficulty: c.difficulty,
      })),
    };

    // Call OpenAI for pricing suggestion
    const prompt = `Based on the following course information and market data, suggest an appropriate price for this course.

Course Information:
${JSON.stringify(context.course, null, 2)}

Course Statistics:
${JSON.stringify(context.statistics, null, 2)}

Similar Courses in Market:
${JSON.stringify(context.similarCourses, null, 2)}

Please analyze and suggest:
1. A recommended price point
2. A price range (min, max, recommended)
3. Reasoning for the pricing

Return a JSON object with this format:
{
  "suggestedPrice": 99.99,
  "reasoning": "Detailed reasoning for the price suggestion",
  "priceRange": {
    "min": 49.99,
    "max": 149.99,
    "recommended": 99.99
  }
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert pricing analyst for online courses. Provide data-driven pricing recommendations. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    let suggestion: {
      suggestedPrice: number;
      reasoning: string;
      priceRange: { min: number; max: number; recommended: number };
    };
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0]);
      } else {
        suggestion = JSON.parse(aiResponse);
      }
    } catch (error) {
      logger.error('Error parsing AI pricing suggestion:', error);
      // Fallback to simple calculation
      const avgPrice = similarCourses.length > 0
        ? similarCourses.reduce((sum, c) => sum + (c.price || 0), 0) / similarCourses.length
        : 99.99;
      
      return {
        suggestedPrice: avgPrice,
        reasoning: 'Based on average price of similar courses',
        priceRange: {
          min: avgPrice * 0.5,
          max: avgPrice * 1.5,
          recommended: avgPrice,
        },
      };
    }

    return suggestion;
  } catch (error) {
    logger.error('Error getting AI pricing suggestion:', error);
    throw error;
  }
};


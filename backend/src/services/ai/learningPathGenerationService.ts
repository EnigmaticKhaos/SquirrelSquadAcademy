import OpenAI from 'openai';
import { config } from '../../config/env';
import Course from '../../models/Course';
import LearningPath, { ILearningPath } from '../../models/LearningPath';
import logger from '../../utils/logger';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Generate AI-powered learning path
 */
export const generateLearningPath = async (data: {
  targetSkill: string;
  currentLevel?: string;
  learningStyle?: string;
  timeCommitment?: string;
  interests?: string[];
}): Promise<ILearningPath | null> => {
  try {
    // Find relevant courses
    const courseQuery: any = { status: 'published' };
    if (data.interests && data.interests.length > 0) {
      courseQuery.tags = { $in: data.interests };
    }

    const availableCourses = await Course.find(courseQuery)
      .select('title description difficulty estimatedDuration tags category courseType')
      .limit(50);

    if (availableCourses.length === 0) {
      throw new Error('No courses available for learning path generation');
    }

    // Generate learning path using AI
    const prompt = `You are an expert learning path designer. Create a comprehensive learning path for someone who wants to learn: "${data.targetSkill}".

Current Level: ${data.currentLevel || 'beginner'}
Learning Style: ${data.learningStyle || 'balanced'}
Time Commitment: ${data.timeCommitment || 'flexible'}

Available Courses:
${availableCourses.map((course, index) => 
  `${index + 1}. ${course.title} (${course.difficulty}, ${course.estimatedDuration}h) - ${course.description?.substring(0, 100)}...`
).join('\n')}

Create a structured learning path that:
1. Selects 5-10 relevant courses from the available courses
2. Orders them logically from beginner to advanced
3. Ensures prerequisites are met
4. Provides a clear progression path
5. Includes both coding and non-coding courses if relevant

Return a JSON object with:
{
  "name": "Learning Path Name",
  "description": "Detailed description of the learning path",
  "courses": [
    {
      "courseTitle": "Course title to match",
      "order": 1,
      "isRequired": true
    }
  ],
  "estimatedDuration": total hours,
  "difficulty": "beginner|intermediate|advanced|expert",
  "tags": ["tag1", "tag2"],
  "milestones": [
    {
      "name": "Milestone name",
      "description": "Description",
      "courseIndex": 2,
      "xpReward": 100
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert learning path designer. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const pathData = JSON.parse(jsonMatch[0]);

    // Match courses by title
    const courses: Array<{ course: any; order: number; isRequired: boolean }> = [];
    for (const courseData of pathData.courses) {
      const matchedCourse = availableCourses.find(
        (c) => c.title.toLowerCase() === courseData.courseTitle.toLowerCase()
      );
      if (matchedCourse) {
        courses.push({
          course: matchedCourse._id,
          order: courseData.order,
          isRequired: courseData.isRequired !== false,
        });
      }
    }

    if (courses.length === 0) {
      throw new Error('No courses matched for learning path');
    }

    // Create learning path
    const learningPath = await LearningPath.create({
      name: pathData.name || `Learn ${data.targetSkill}`,
      description: pathData.description || `A comprehensive learning path to master ${data.targetSkill}`,
      type: 'ai-powered',
      courses,
      estimatedDuration: pathData.estimatedDuration || courses.reduce((sum, c) => {
        const course = availableCourses.find((ac) => ac._id.toString() === c.course.toString());
        return sum + (course?.estimatedDuration || 0);
      }, 0),
      difficulty: pathData.difficulty || 'intermediate',
      tags: pathData.tags || [data.targetSkill],
      milestones: pathData.milestones || [],
      aiSettings: {
        targetSkill: data.targetSkill,
        currentLevel: data.currentLevel,
        learningStyle: data.learningStyle,
        timeCommitment: data.timeCommitment,
        interests: data.interests,
      },
      isActive: true,
      isPublic: true,
    });

    logger.info(`AI-generated learning path created: ${learningPath._id}`);
    return learningPath;
  } catch (error) {
    logger.error('Error generating AI learning path:', error);
    throw error;
  }
};


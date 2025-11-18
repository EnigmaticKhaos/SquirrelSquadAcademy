import OpenAI from 'openai';
import { config } from '../../config/env';
import Course from '../../models/Course';
import Module from '../../models/Module';
import Lesson from '../../models/Lesson';
import logger from '../../utils/logger';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

interface CourseGenerationRequest {
  title: string;
  description: string;
  desiredContent: string;
  difficulty?: string;
  estimatedDuration?: number;
}

export const generateCourse = async (request: CourseGenerationRequest): Promise<any> => {
  try {
    const prompt = buildCourseGenerationPrompt(request);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert course creator. Create comprehensive, detailed course content at bootcamp/academy level depth. The content should be thorough, educational, and structured like a professional bootcamp curriculum. Include full explanations, examples, and practice exercises.',
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

    // Parse AI response (assuming JSON format)
    const courseData = JSON.parse(aiResponse);

    // Determine course type (coding vs non-coding)
    const courseType = determineCourseType(courseData);

    // Create course
    const course = await Course.create({
      title: request.title,
      description: request.description,
      courseType,
      difficulty: request.difficulty || courseData.difficulty || 'beginner',
      estimatedDuration: request.estimatedDuration || courseData.estimatedDuration || 10,
      tags: courseData.tags || [],
      category: courseData.category || 'general',
      status: 'draft', // Admin will review before publishing
    });

    // Create modules and lessons
    if (courseData.modules && Array.isArray(courseData.modules)) {
      for (let i = 0; i < courseData.modules.length; i++) {
        const moduleData = courseData.modules[i];
        const module = await Module.create({
          course: course._id,
          title: moduleData.title,
          description: moduleData.description,
          order: i + 1,
        });

        // Create lessons for this module
        if (moduleData.lessons && Array.isArray(moduleData.lessons)) {
          for (let j = 0; j < moduleData.lessons.length; j++) {
            const lessonData = moduleData.lessons[j];
            await Lesson.create({
              module: module._id,
              title: lessonData.title,
              content: lessonData.content,
              order: j + 1,
              hasVideo: lessonData.hasVideo || false,
              videoSource: lessonData.videoSource,
              videoUrl: lessonData.videoUrl,
            });
          }
        }

        course.modules.push(module._id);
      }
    }

    await course.save();

    logger.info(`Course ${course._id} generated successfully`);
    return course;
  } catch (error) {
    logger.error('Error generating course:', error);
    throw error;
  }
};

const buildCourseGenerationPrompt = (request: CourseGenerationRequest): string => {
  let prompt = `Create a comprehensive, detailed course with the following specifications:\n\n`;
  prompt += `Title: ${request.title}\n`;
  prompt += `Description: ${request.description}\n`;
  prompt += `Desired Content: ${request.desiredContent}\n\n`;
  
  if (request.difficulty) {
    prompt += `Difficulty Level: ${request.difficulty}\n`;
  }
  
  if (request.estimatedDuration) {
    prompt += `Estimated Duration: ${request.estimatedDuration} hours\n`;
  }

  prompt += `\nPlease create a complete course structure with:\n`;
  prompt += `- Multiple modules (at least 5-10 modules)\n`;
  prompt += `- Each module should have multiple lessons (at least 3-5 lessons per module)\n`;
  prompt += `- Each lesson should have comprehensive content (not snippets, but full detailed explanations)\n`;
  prompt += `- Include examples, practice exercises, and real-world applications\n`;
  prompt += `- Structure it like a professional bootcamp curriculum\n\n`;
  prompt += `Return a JSON object with the following structure:\n`;
  prompt += `{\n`;
  prompt += `  "courseType": "coding" | "non-coding",\n`;
  prompt += `  "difficulty": "beginner" | "intermediate" | "advanced" | "expert",\n`;
  prompt += `  "estimatedDuration": <number in hours>,\n`;
  prompt += `  "tags": ["tag1", "tag2", ...],\n`;
  prompt += `  "category": "<category name>",\n`;
  prompt += `  "modules": [\n`;
  prompt += `    {\n`;
  prompt += `      "title": "<module title>",\n`;
  prompt += `      "description": "<module description>",\n`;
  prompt += `      "lessons": [\n`;
  prompt += `        {\n`;
  prompt += `          "title": "<lesson title>",\n`;
  prompt += `          "content": "<comprehensive lesson content - detailed, not snippets>",\n`;
  prompt += `          "hasVideo": <boolean>,\n`;
  prompt += `          "videoSource": "upload" | "youtube" | null,\n`;
  prompt += `          "videoUrl": "<url if applicable>"\n`;
  prompt += `        }\n`;
  prompt += `      ]\n`;
  prompt += `    }\n`;
  prompt += `  ]\n`;
  prompt += `}\n`;

  return prompt;
};

const determineCourseType = (courseData: any): 'coding' | 'non-coding' => {
  // Simple heuristic - can be improved
  const codingKeywords = ['code', 'programming', 'developer', 'software', 'javascript', 'python', 'react', 'node', 'api', 'algorithm', 'data structure'];
  const content = JSON.stringify(courseData).toLowerCase();
  
  return codingKeywords.some(keyword => content.includes(keyword)) ? 'coding' : 'non-coding';
};


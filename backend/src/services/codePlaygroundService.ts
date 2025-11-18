import CodeSnippet, { SupportedLanguage } from '../models/CodeSnippet';
import Course from '../models/Course';
import { executeCode, validateCode } from './codeExecutionService';
import logger from '../utils/logger';

/**
 * Save code snippet
 */
export const saveCodeSnippet = async (
  userId: string,
  data: {
    code: string;
    language: SupportedLanguage;
    title?: string;
    courseId?: string;
    lessonId?: string;
    assignmentId?: string;
    isPublic?: boolean;
    tags?: string[];
    description?: string;
  }
): Promise<CodeSnippet> => {
  try {
    // Verify course is coding type if courseId is provided
    if (data.courseId) {
      const course = await Course.findById(data.courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      if (course.courseType !== 'coding') {
        throw new Error('Code playground is only available for coding courses');
      }
    }

    const snippet = await CodeSnippet.create({
      user: userId,
      code: data.code,
      language: data.language,
      title: data.title,
      course: data.courseId,
      lesson: data.lessonId,
      assignment: data.assignmentId,
      isPublic: data.isPublic || false,
      tags: data.tags,
      description: data.description,
    });

    logger.info(`Code snippet saved: ${snippet._id} by user ${userId}`);
    return snippet;
  } catch (error) {
    logger.error('Error saving code snippet:', error);
    throw error;
  }
};

/**
 * Update code snippet
 */
export const updateCodeSnippet = async (
  snippetId: string,
  userId: string,
  updates: {
    code?: string;
    language?: SupportedLanguage;
    title?: string;
    isPublic?: boolean;
    tags?: string[];
    description?: string;
  }
): Promise<CodeSnippet> => {
  try {
    const snippet = await CodeSnippet.findById(snippetId);
    if (!snippet) {
      throw new Error('Code snippet not found');
    }

    if (snippet.user.toString() !== userId) {
      throw new Error('Unauthorized to update this snippet');
    }

    Object.assign(snippet, updates);
    await snippet.save();

    logger.info(`Code snippet updated: ${snippetId} by user ${userId}`);
    return snippet;
  } catch (error) {
    logger.error('Error updating code snippet:', error);
    throw error;
  }
};

/**
 * Delete code snippet
 */
export const deleteCodeSnippet = async (
  snippetId: string,
  userId: string
): Promise<void> => {
  try {
    const snippet = await CodeSnippet.findById(snippetId);
    if (!snippet) {
      throw new Error('Code snippet not found');
    }

    if (snippet.user.toString() !== userId) {
      throw new Error('Unauthorized to delete this snippet');
    }

    await snippet.deleteOne();

    logger.info(`Code snippet deleted: ${snippetId} by user ${userId}`);
  } catch (error) {
    logger.error('Error deleting code snippet:', error);
    throw error;
  }
};

/**
 * Get user's code snippets
 */
export const getUserSnippets = async (
  userId: string,
  options?: {
    courseId?: string;
    lessonId?: string;
    assignmentId?: string;
    language?: SupportedLanguage;
    limit?: number;
    offset?: number;
  }
): Promise<{ snippets: CodeSnippet[]; total: number }> => {
  try {
    const query: any = { user: userId };

    if (options?.courseId) {
      query.course = options.courseId;
    }
    if (options?.lessonId) {
      query.lesson = options.lessonId;
    }
    if (options?.assignmentId) {
      query.assignment = options.assignmentId;
    }
    if (options?.language) {
      query.language = options.language;
    }

    const total = await CodeSnippet.countDocuments(query);

    const snippets = await CodeSnippet.find(query)
      .populate('course', 'title courseType')
      .populate('lesson', 'title')
      .populate('assignment', 'title')
      .sort({ updatedAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { snippets, total };
  } catch (error) {
    logger.error('Error getting user snippets:', error);
    throw error;
  }
};

/**
 * Get public code snippets
 */
export const getPublicSnippets = async (options?: {
  language?: SupportedLanguage;
  courseId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ snippets: CodeSnippet[]; total: number }> => {
  try {
    const query: any = { isPublic: true };

    if (options?.language) {
      query.language = options.language;
    }
    if (options?.courseId) {
      query.course = options.courseId;
    }

    const total = await CodeSnippet.countDocuments(query);

    const snippets = await CodeSnippet.find(query)
      .populate('user', 'username profilePhoto')
      .populate('course', 'title courseType')
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { snippets, total };
  } catch (error) {
    logger.error('Error getting public snippets:', error);
    throw error;
  }
};

/**
 * Get code snippet by ID
 */
export const getCodeSnippet = async (
  snippetId: string,
  userId?: string
): Promise<CodeSnippet> => {
  try {
    const snippet = await CodeSnippet.findById(snippetId)
      .populate('user', 'username profilePhoto')
      .populate('course', 'title courseType')
      .populate('lesson', 'title')
      .populate('assignment', 'title');

    if (!snippet) {
      throw new Error('Code snippet not found');
    }

    // Check if user can access this snippet
    if (!snippet.isPublic && snippet.user.toString() !== userId) {
      throw new Error('Unauthorized to access this snippet');
    }

    return snippet;
  } catch (error) {
    logger.error('Error getting code snippet:', error);
    throw error;
  }
};

/**
 * Execute code and save result
 */
export const executeAndSave = async (
  snippetId: string,
  userId: string,
  stdin?: string
): Promise<CodeSnippet> => {
  try {
    const snippet = await CodeSnippet.findById(snippetId);
    if (!snippet) {
      throw new Error('Code snippet not found');
    }

    if (snippet.user.toString() !== userId) {
      throw new Error('Unauthorized to execute this snippet');
    }

    // Execute code
    const result = await executeCode(snippet.code, snippet.language, stdin);

    // Update snippet with execution result
    snippet.lastExecuted = new Date();
    snippet.executionResult = result;
    await snippet.save();

    logger.info(`Code executed: ${snippetId} by user ${userId}`);
    return snippet;
  } catch (error) {
    logger.error('Error executing code:', error);
    throw error;
  }
};

/**
 * Execute code without saving (for quick testing)
 */
export const executeCodeQuick = async (
  code: string,
  language: SupportedLanguage,
  stdin?: string
): Promise<any> => {
  try {
    const result = await executeCode(code, language, stdin);
    return result;
  } catch (error) {
    logger.error('Error executing code quickly:', error);
    throw error;
  }
};


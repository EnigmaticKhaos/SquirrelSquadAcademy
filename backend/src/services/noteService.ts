import Note from '../models/Note';
import Lesson from '../models/Lesson';
import Course from '../models/Course';
import logger from '../utils/logger';

/**
 * Create a new note
 */
export const createNote = async (
  userId: string,
  data: {
    lessonId: string;
    courseId: string;
    title?: string;
    content: string;
    isHighlight?: boolean;
    highlightedText?: string;
    highlightStart?: number;
    highlightEnd?: number;
    highlightColor?: string;
    position?: {
      section?: string;
      timestamp?: number;
      paragraphIndex?: number;
    };
    tags?: string[];
    isPinned?: boolean;
  }
): Promise<Note> => {
  try {
    // Verify lesson and course exist
    const lesson = await Lesson.findById(data.lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const course = await Course.findById(data.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const note = await Note.create({
      user: userId,
      lesson: data.lessonId,
      course: data.courseId,
      title: data.title,
      content: data.content,
      isHighlight: data.isHighlight || false,
      highlightedText: data.highlightedText,
      highlightStart: data.highlightStart,
      highlightEnd: data.highlightEnd,
      highlightColor: data.highlightColor || '#FFEB3B',
      position: data.position,
      tags: data.tags || [],
      isPinned: data.isPinned || false,
    });

    logger.info(`Note created: ${note._id} by user ${userId}`);
    return note;
  } catch (error) {
    logger.error('Error creating note:', error);
    throw error;
  }
};

/**
 * Update a note
 */
export const updateNote = async (
  noteId: string,
  userId: string,
  updates: {
    title?: string;
    content?: string;
    tags?: string[];
    isPinned?: boolean;
    highlightColor?: string;
  }
): Promise<Note | null> => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: noteId, user: userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!note) {
      return null;
    }

    logger.info(`Note updated: ${noteId} by user ${userId}`);
    return note;
  } catch (error) {
    logger.error('Error updating note:', error);
    throw error;
  }
};

/**
 * Delete a note
 */
export const deleteNote = async (
  noteId: string,
  userId: string
): Promise<boolean> => {
  try {
    const result = await Note.findOneAndDelete({
      _id: noteId,
      user: userId,
    });

    if (!result) {
      return false;
    }

    logger.info(`Note deleted: ${noteId} by user ${userId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting note:', error);
    throw error;
  }
};

/**
 * Get notes for a lesson
 */
export const getLessonNotes = async (
  userId: string,
  lessonId: string
): Promise<Note[]> => {
  try {
    return await Note.find({
      user: userId,
      lesson: lessonId,
    })
      .populate('lesson', 'title')
      .populate('course', 'title')
      .sort({ isPinned: -1, createdAt: -1 });
  } catch (error) {
    logger.error('Error getting lesson notes:', error);
    return [];
  }
};

/**
 * Get notes for a course
 */
export const getCourseNotes = async (
  userId: string,
  courseId: string,
  options?: {
    tags?: string[];
    isHighlight?: boolean;
    isPinned?: boolean;
  }
): Promise<Note[]> => {
  try {
    const query: any = {
      user: userId,
      course: courseId,
    };

    if (options?.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }

    if (options?.isHighlight !== undefined) {
      query.isHighlight = options.isHighlight;
    }

    if (options?.isPinned !== undefined) {
      query.isPinned = options.isPinned;
    }

    return await Note.find(query)
      .populate('lesson', 'title order')
      .populate('course', 'title')
      .sort({ isPinned: -1, 'lesson.order': 1, createdAt: -1 });
  } catch (error) {
    logger.error('Error getting course notes:', error);
    return [];
  }
};

/**
 * Get all user notes
 */
export const getUserNotes = async (
  userId: string,
  options?: {
    tags?: string[];
    isHighlight?: boolean;
    isPinned?: boolean;
    courseId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ notes: Note[]; total: number }> => {
  try {
    const query: any = { user: userId };

    if (options?.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }

    if (options?.isHighlight !== undefined) {
      query.isHighlight = options.isHighlight;
    }

    if (options?.isPinned !== undefined) {
      query.isPinned = options.isPinned;
    }

    if (options?.courseId) {
      query.course = options.courseId;
    }

    const total = await Note.countDocuments(query);

    const notes = await Note.find(query)
      .populate('lesson', 'title order')
      .populate('course', 'title thumbnail')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { notes, total };
  } catch (error) {
    logger.error('Error getting user notes:', error);
    return { notes: [], total: 0 };
  }
};

/**
 * Get note by ID
 */
export const getNoteById = async (
  noteId: string,
  userId: string
): Promise<Note | null> => {
  try {
    return await Note.findOne({
      _id: noteId,
      user: userId,
    })
      .populate('lesson', 'title content')
      .populate('course', 'title');
  } catch (error) {
    logger.error('Error getting note by ID:', error);
    return null;
  }
};

/**
 * Get user's note tags
 */
export const getUserNoteTags = async (userId: string): Promise<string[]> => {
  try {
    const notes = await Note.find({ user: userId }).select('tags');
    const allTags = notes.flatMap((note) => note.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.sort();
  } catch (error) {
    logger.error('Error getting user note tags:', error);
    return [];
  }
};

/**
 * Search notes
 */
export const searchNotes = async (
  userId: string,
  searchQuery: string,
  options?: {
    courseId?: string;
    lessonId?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }
): Promise<{ notes: Note[]; total: number }> => {
  try {
    const query: any = {
      user: userId,
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } },
        { highlightedText: { $regex: searchQuery, $options: 'i' } },
      ],
    };

    if (options?.courseId) {
      query.course = options.courseId;
    }

    if (options?.lessonId) {
      query.lesson = options.lessonId;
    }

    if (options?.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }

    const total = await Note.countDocuments(query);

    const notes = await Note.find(query)
      .populate('lesson', 'title order')
      .populate('course', 'title thumbnail')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { notes, total };
  } catch (error) {
    logger.error('Error searching notes:', error);
    return { notes: [], total: 0 };
  }
};

/**
 * Pin/unpin a note
 */
export const togglePinNote = async (
  noteId: string,
  userId: string
): Promise<Note | null> => {
  try {
    const note = await Note.findOne({ _id: noteId, user: userId });
    if (!note) {
      return null;
    }

    note.isPinned = !note.isPinned;
    await note.save();

    return note;
  } catch (error) {
    logger.error('Error toggling note pin:', error);
    throw error;
  }
};


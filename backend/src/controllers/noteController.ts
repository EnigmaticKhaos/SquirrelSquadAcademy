import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import {
  createNote,
  updateNote,
  deleteNote,
  getLessonNotes,
  getCourseNotes,
  getUserNotes,
  getNoteById,
  getUserNoteTags,
  searchNotes,
  togglePinNote,
} from '../services/noteService';

// @desc    Create a note
// @route   POST /api/notes
// @access  Private
export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const {
    lessonId,
    courseId,
    title,
    content,
    isHighlight,
    highlightedText,
    highlightStart,
    highlightEnd,
    highlightColor,
    position,
    tags,
    isPinned,
  } = req.body;

  if (!lessonId || !courseId || !content) {
    return res.status(400).json({
      success: false,
      message: 'Lesson ID, course ID, and content are required',
    });
  }

  const note = await createNote(userId, {
    lessonId,
    courseId,
    title,
    content,
    isHighlight,
    highlightedText,
    highlightStart,
    highlightEnd,
    highlightColor,
    position,
    tags,
    isPinned,
  });

  res.status(201).json({
    success: true,
    message: 'Note created successfully',
    note,
  });
});

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { title, content, tags, isPinned, highlightColor } = req.body;

  const note = await updateNote(id, userId, {
    title,
    content,
    tags,
    isPinned,
    highlightColor,
  });

  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found',
    });
  }

  res.json({
    success: true,
    message: 'Note updated successfully',
    note,
  });
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const deleted = await deleteNote(id, userId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Note not found',
    });
  }

  res.json({
    success: true,
    message: 'Note deleted successfully',
  });
});

// @desc    Get notes for a lesson
// @route   GET /api/notes/lesson/:lessonId
// @access  Private
export const getByLesson = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user._id.toString();

  const notes = await getLessonNotes(userId, lessonId);

  res.json({
    success: true,
    count: notes.length,
    notes,
  });
});

// @desc    Get notes for a course
// @route   GET /api/notes/course/:courseId
// @access  Private
export const getByCourse = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();
  const { tags, isHighlight, isPinned } = req.query;

  const notes = await getCourseNotes(userId, courseId, {
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
    isHighlight: isHighlight === 'true' ? true : isHighlight === 'false' ? false : undefined,
    isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
  });

  res.json({
    success: true,
    count: notes.length,
    notes,
  });
});

// @desc    Get all user notes
// @route   GET /api/notes
// @access  Private
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { tags, isHighlight, isPinned, courseId, limit = 50, offset = 0 } = req.query;

  const { notes, total } = await getUserNotes(userId, {
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
    isHighlight: isHighlight === 'true' ? true : isHighlight === 'false' ? false : undefined,
    isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
    courseId: courseId as string,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: notes.length,
    total,
    notes,
  });
});

// @desc    Get a single note
// @route   GET /api/notes/:id
// @access  Private
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const note = await getNoteById(id, userId);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found',
    });
  }

  res.json({
    success: true,
    note,
  });
});

// @desc    Get user's note tags
// @route   GET /api/notes/tags
// @access  Private
export const getTags = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const tags = await getUserNoteTags(userId);

  res.json({
    success: true,
    tags,
  });
});

// @desc    Search notes
// @route   GET /api/notes/search
// @access  Private
export const search = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { q, courseId, lessonId, tags, limit = 50, offset = 0 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const { notes, total } = await searchNotes(userId, q as string, {
    courseId: courseId as string,
    lessonId: lessonId as string,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: notes.length,
    total,
    notes,
  });
});

// @desc    Toggle pin on a note
// @route   POST /api/notes/:id/pin
// @access  Private
export const togglePin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const note = await togglePinNote(id, userId);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found',
    });
  }

  res.json({
    success: true,
    message: note.isPinned ? 'Note pinned' : 'Note unpinned',
    note,
  });
});


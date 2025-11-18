import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import {
  saveCodeSnippet,
  updateCodeSnippet,
  deleteCodeSnippet,
  getUserSnippets,
  getPublicSnippets,
  getCodeSnippet,
  executeAndSave,
  executeCodeQuick,
} from '../services/codePlaygroundService';
import { validateCode } from '../services/codeExecutionService';
import Course from '../models/Course';

// @desc    Save code snippet
// @route   POST /api/playground/snippets
// @access  Private
export const saveSnippet = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { code, language, title, courseId, lessonId, assignmentId, isPublic, tags, description } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      success: false,
      message: 'Code and language are required',
    });
  }

  // Verify course is coding type if courseId is provided
  if (courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }
    if (course.courseType !== 'coding') {
      return res.status(400).json({
        success: false,
        message: 'Code playground is only available for coding courses',
      });
    }
  }

  const snippet = await saveCodeSnippet(userId, {
    code,
    language,
    title,
    courseId,
    lessonId,
    assignmentId,
    isPublic,
    tags,
    description,
  });

  res.status(201).json({
    success: true,
    data: snippet,
  });
});

// @desc    Update code snippet
// @route   PUT /api/playground/snippets/:id
// @access  Private
export const updateSnippet = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { code, language, title, isPublic, tags, description } = req.body;

  const snippet = await updateCodeSnippet(id, userId, {
    code,
    language,
    title,
    isPublic,
    tags,
    description,
  });

  res.json({
    success: true,
    data: snippet,
  });
});

// @desc    Delete code snippet
// @route   DELETE /api/playground/snippets/:id
// @access  Private
export const deleteSnippet = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  await deleteCodeSnippet(id, userId);

  res.json({
    success: true,
    message: 'Code snippet deleted successfully',
  });
});

// @desc    Get user's code snippets
// @route   GET /api/playground/snippets
// @access  Private
export const getMySnippets = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { courseId, lessonId, assignmentId, language, limit = 50, offset = 0 } = req.query;

  const { snippets, total } = await getUserSnippets(userId, {
    courseId: courseId as string,
    lessonId: lessonId as string,
    assignmentId: assignmentId as string,
    language: language as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: snippets.length,
    total,
    data: snippets,
  });
});

// @desc    Get public code snippets
// @route   GET /api/playground/snippets/public
// @access  Public
export const getPublicSnippetsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { language, courseId, limit = 50, offset = 0 } = req.query;

  const { snippets, total } = await getPublicSnippets({
    language: language as any,
    courseId: courseId as string,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: snippets.length,
    total,
    data: snippets,
  });
});

// @desc    Get code snippet by ID
// @route   GET /api/playground/snippets/:id
// @access  Private/Public (depending on snippet visibility)
export const getSnippet = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id?.toString();

  const snippet = await getCodeSnippet(id, userId);

  res.json({
    success: true,
    data: snippet,
  });
});

// @desc    Execute code and save result
// @route   POST /api/playground/snippets/:id/execute
// @access  Private
export const executeSnippet = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { stdin } = req.body;

  const snippet = await executeAndSave(id, userId, stdin);

  res.json({
    success: true,
    data: snippet,
  });
});

// @desc    Execute code quickly (without saving)
// @route   POST /api/playground/execute
// @access  Private
export const executeQuick = asyncHandler(async (req: Request, res: Response) => {
  const { code, language, stdin } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      success: false,
      message: 'Code and language are required',
    });
  }

  const result = await executeCodeQuick(code, language, stdin);

  res.json({
    success: true,
    data: result,
  });
});

// @desc    Validate code syntax
// @route   POST /api/playground/validate
// @access  Private
export const validateCodeHandler = asyncHandler(async (req: Request, res: Response) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      success: false,
      message: 'Code and language are required',
    });
  }

  const validation = await validateCode(code, language);

  res.json({
    success: true,
    data: validation,
  });
});


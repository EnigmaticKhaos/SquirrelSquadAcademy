import { Request, Response } from 'express';
import Lesson from '../models/Lesson';
import Module from '../models/Module';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';

// @desc    Get lessons for a module
// @route   GET /api/modules/:moduleId/lessons
// @access  Public
export const getLessons = asyncHandler(async (req: Request, res: Response) => {
  const { moduleId } = req.params;

  const lessons = await Lesson.find({ module: moduleId })
    .sort({ order: 1 });

  res.json({
    success: true,
    count: lessons.length,
    lessons,
  });
});

// @desc    Get single lesson
// @route   GET /api/lessons/:id
// @access  Public
export const getLesson = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const lesson = await Lesson.findById(id)
    .populate('assignments')
    .populate('quizzes')
    .populate('exercises')
    .populate('prerequisites');

  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
  }

  res.json({
    success: true,
    lesson,
  });
});

// @desc    Create lesson
// @route   POST /api/modules/:moduleId/lessons
// @access  Private/Admin
export const createLesson = asyncHandler(async (req: Request, res: Response) => {
  const { moduleId } = req.params;

  const module = await Module.findById(moduleId);

  if (!module) {
    return res.status(404).json({
      success: false,
      message: 'Module not found',
    });
  }

  const lesson = await Lesson.create({
    ...req.body,
    module: moduleId,
  });

  // Add lesson to module
  module.lessons.push(lesson._id);
  await module.save();

  res.status(201).json({
    success: true,
    message: 'Lesson created successfully',
    lesson,
  });
});

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private/Admin
export const updateLesson = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const lesson = await Lesson.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
  }

  res.json({
    success: true,
    message: 'Lesson updated successfully',
    lesson,
  });
});

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private/Admin
export const deleteLesson = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const lesson = await Lesson.findById(id);

  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
  }

  // Remove from module
  await Module.findByIdAndUpdate(lesson.module, {
    $pull: { lessons: id },
  });

  await lesson.deleteOne();

  res.json({
    success: true,
    message: 'Lesson deleted successfully',
  });
});


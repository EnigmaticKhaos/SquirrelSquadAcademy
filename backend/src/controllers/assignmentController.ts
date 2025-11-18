import { Request, Response } from 'express';
import Assignment from '../models/Assignment';
import Lesson from '../models/Lesson';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';

// @desc    Get assignments for a lesson
// @route   GET /api/lessons/:lessonId/assignments
// @access  Public
export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;

  const assignments = await Assignment.find({ lesson: lessonId })
    .populate('rubric');

  res.json({
    success: true,
    count: assignments.length,
    assignments,
  });
});

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Public
export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id)
    .populate('rubric')
    .populate('lesson')
    .populate('course');

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  res.json({
    success: true,
    assignment,
  });
});

// @desc    Create assignment
// @route   POST /api/lessons/:lessonId/assignments
// @access  Private/Admin
export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;

  const lesson = await Lesson.findById(lessonId);

  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
  }

  const assignment = await Assignment.create({
    ...req.body,
    lesson: lessonId,
    course: lesson.module, // Will need to populate to get course
  });

  // Add assignment to lesson
  lesson.assignments.push(assignment._id);
  await lesson.save();

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    assignment,
  });
});

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private/Admin
export const updateAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const assignment = await Assignment.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  res.json({
    success: true,
    message: 'Assignment updated successfully',
    assignment,
  });
});

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Admin
export const deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id);

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  // Remove from lesson
  await Lesson.findByIdAndUpdate(assignment.lesson, {
    $pull: { assignments: id },
  });

  await assignment.deleteOne();

  res.json({
    success: true,
    message: 'Assignment deleted successfully',
  });
});


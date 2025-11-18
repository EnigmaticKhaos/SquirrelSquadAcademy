import { Request, Response } from 'express';
import Module from '../models/Module';
import Course from '../models/Course';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';

// @desc    Get modules for a course
// @route   GET /api/courses/:courseId/modules
// @access  Public
export const getModules = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  const modules = await Module.find({ course: courseId })
    .populate('lessons')
    .sort({ order: 1 });

  res.json({
    success: true,
    count: modules.length,
    modules,
  });
});

// @desc    Get single module
// @route   GET /api/modules/:id
// @access  Public
export const getModule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const module = await Module.findById(id)
    .populate('lessons')
    .populate('prerequisites');

  if (!module) {
    return res.status(404).json({
      success: false,
      message: 'Module not found',
    });
  }

  res.json({
    success: true,
    module,
  });
});

// @desc    Create module
// @route   POST /api/courses/:courseId/modules
// @access  Private/Admin
export const createModule = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  const module = await Module.create({
    ...req.body,
    course: courseId,
  });

  // Add module to course
  course.modules.push(module._id);
  await course.save();

  res.status(201).json({
    success: true,
    message: 'Module created successfully',
    module,
  });
});

// @desc    Update module
// @route   PUT /api/modules/:id
// @access  Private/Admin
export const updateModule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const module = await Module.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!module) {
    return res.status(404).json({
      success: false,
      message: 'Module not found',
    });
  }

  res.json({
    success: true,
    message: 'Module updated successfully',
    module,
  });
});

// @desc    Delete module
// @route   DELETE /api/modules/:id
// @access  Private/Admin
export const deleteModule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const module = await Module.findById(id);

  if (!module) {
    return res.status(404).json({
      success: false,
      message: 'Module not found',
    });
  }

  // Remove from course
  await Course.findByIdAndUpdate(module.course, {
    $pull: { modules: id },
  });

  await module.deleteOne();

  res.json({
    success: true,
    message: 'Module deleted successfully',
  });
});


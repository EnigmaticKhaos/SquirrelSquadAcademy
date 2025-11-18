import { Request, Response } from 'express';
import Rubric from '../models/Rubric';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';

// @desc    Get all rubrics
// @route   GET /api/rubrics
// @access  Public
export const getRubrics = asyncHandler(async (req: Request, res: Response) => {
  const { rubricType } = req.query;

  const query: any = {};
  if (rubricType) query.rubricType = rubricType;

  const rubrics = await Rubric.find(query).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: rubrics.length,
    rubrics,
  });
});

// @desc    Get single rubric
// @route   GET /api/rubrics/:id
// @access  Public
export const getRubric = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const rubric = await Rubric.findById(id);

  if (!rubric) {
    return res.status(404).json({
      success: false,
      message: 'Rubric not found',
    });
  }

  res.json({
    success: true,
    rubric,
  });
});

// @desc    Create rubric
// @route   POST /api/rubrics
// @access  Private/Admin
export const createRubric = asyncHandler(async (req: Request, res: Response) => {
  const rubric = await Rubric.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Rubric created successfully',
    rubric,
  });
});

// @desc    Update rubric
// @route   PUT /api/rubrics/:id
// @access  Private/Admin
export const updateRubric = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const rubric = await Rubric.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!rubric) {
    return res.status(404).json({
      success: false,
      message: 'Rubric not found',
    });
  }

  res.json({
    success: true,
    message: 'Rubric updated successfully',
    rubric,
  });
});

// @desc    Delete rubric
// @route   DELETE /api/rubrics/:id
// @access  Private/Admin
export const deleteRubric = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const rubric = await Rubric.findById(id);

  if (!rubric) {
    return res.status(404).json({
      success: false,
      message: 'Rubric not found',
    });
  }

  await rubric.deleteOne();

  res.json({
    success: true,
    message: 'Rubric deleted successfully',
  });
});


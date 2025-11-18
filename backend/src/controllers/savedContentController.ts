import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import {
  saveContent,
  unsaveContent,
  isContentSaved,
  getUserSavedContent,
  getSavedContentByType,
  updateSavedContent,
  getUserFolders,
  getUserSavedContentTags,
  getSavedContentStats,
} from '../services/savedContentService';

// @desc    Save content
// @route   POST /api/saved-content
// @access  Private
export const save = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { contentType, contentId, folder, tags, notes } = req.body;

  if (!contentType || !contentId) {
    return res.status(400).json({
      success: false,
      message: 'Content type and content ID are required',
    });
  }

  const savedContent = await saveContent(userId, {
    contentType,
    contentId,
    folder,
    tags,
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Content saved successfully',
    savedContent,
  });
});

// @desc    Unsave content
// @route   DELETE /api/saved-content/:contentType/:contentId
// @access  Private
export const unsave = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { contentType, contentId } = req.params;

  const deleted = await unsaveContent(userId, contentType, contentId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Saved content not found',
    });
  }

  res.json({
    success: true,
    message: 'Content unsaved successfully',
  });
});

// @desc    Check if content is saved
// @route   GET /api/saved-content/check/:contentType/:contentId
// @access  Private
export const check = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { contentType, contentId } = req.params;

  const isSaved = await isContentSaved(userId, contentType, contentId);

  res.json({
    success: true,
    isSaved,
  });
});

// @desc    Get user's saved content
// @route   GET /api/saved-content
// @access  Private
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { contentType, folder, tags, limit = 50, offset = 0 } = req.query;

  const { savedContent, total } = await getUserSavedContent(userId, {
    contentType: contentType as any,
    folder: folder as string,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: savedContent.length,
    total,
    savedContent,
  });
});

// @desc    Get saved content by type
// @route   GET /api/saved-content/:contentType
// @access  Private
export const getByType = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { contentType } = req.params;
  const { folder, tags, limit = 50, offset = 0 } = req.query;

  const { savedContent, total } = await getSavedContentByType(
    userId,
    contentType as any,
    {
      folder: folder as string,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      limit: Number(limit),
      offset: Number(offset),
    }
  );

  res.json({
    success: true,
    count: savedContent.length,
    total,
    savedContent,
  });
});

// @desc    Update saved content
// @route   PUT /api/saved-content/:id
// @access  Private
export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;
  const { folder, tags, notes } = req.body;

  const savedContent = await updateSavedContent(id, userId, {
    folder,
    tags,
    notes,
  });

  if (!savedContent) {
    return res.status(404).json({
      success: false,
      message: 'Saved content not found',
    });
  }

  res.json({
    success: true,
    message: 'Saved content updated successfully',
    savedContent,
  });
});

// @desc    Get user's folders
// @route   GET /api/saved-content/folders
// @access  Private
export const getFolders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const folders = await getUserFolders(userId);

  res.json({
    success: true,
    folders,
  });
});

// @desc    Get user's tags
// @route   GET /api/saved-content/tags
// @access  Private
export const getTags = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const tags = await getUserSavedContentTags(userId);

  res.json({
    success: true,
    tags,
  });
});

// @desc    Get saved content statistics
// @route   GET /api/saved-content/stats
// @access  Private
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const stats = await getSavedContentStats(userId);

  res.json({
    success: true,
    stats,
  });
});


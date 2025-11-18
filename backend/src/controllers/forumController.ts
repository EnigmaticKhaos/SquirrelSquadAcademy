import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  createForumPost,
  getCourseForumPosts,
  getForumPost,
  getPostReplies,
  updateForumPost,
  deleteForumPost,
  voteOnPost,
  markAsAnswer,
  togglePinPost,
  toggleLockPost,
  getUserForumActivity,
} from '../services/forumService';

// @desc    Create a forum post
// @route   POST /api/forums/:courseId/posts
// @access  Private
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();
  const { type, title, content, parentPostId, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: 'Title and content are required',
    });
  }

  const post = await createForumPost(userId, {
    courseId,
    type: type || 'discussion',
    title,
    content,
    parentPostId,
    tags,
  });

  res.status(201).json({
    success: true,
    message: 'Forum post created successfully',
    post,
  });
});

// @desc    Get forum posts for a course
// @route   GET /api/forums/:courseId/posts
// @access  Public
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const {
    type,
    parentPostId,
    tags,
    search,
    sortBy = 'newest',
    limit = 20,
    offset = 0,
  } = req.query;

  const { posts, total } = await getCourseForumPosts(courseId, {
    type: type as 'question' | 'discussion' | 'announcement',
    parentPostId: parentPostId === 'null' ? null : parentPostId as string,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
    search: search as string,
    sortBy: sortBy as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: posts.length,
    total,
    posts,
  });
});

// @desc    Get a single forum post
// @route   GET /api/forums/posts/:id
// @access  Public
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const post = await getForumPost(id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Forum post not found',
    });
  }

  // Get replies
  const { replies } = await getPostReplies(id, {
    sortBy: 'helpful',
    limit: 50,
  });

  res.json({
    success: true,
    post,
    replies,
  });
});

// @desc    Get replies to a post
// @route   GET /api/forums/posts/:id/replies
// @access  Public
export const getReplies = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sortBy = 'helpful', limit = 50, offset = 0 } = req.query;

  const { replies, total } = await getPostReplies(id, {
    sortBy: sortBy as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: replies.length,
    total,
    replies,
  });
});

// @desc    Update a forum post
// @route   PUT /api/forums/posts/:id
// @access  Private
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { title, content, tags, isPinned, isLocked } = req.body;

  const post = await updateForumPost(id, userId, {
    title,
    content,
    tags,
    isPinned,
    isLocked,
  });

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Forum post not found or unauthorized',
    });
  }

  res.json({
    success: true,
    message: 'Forum post updated successfully',
    post,
  });
});

// @desc    Delete a forum post
// @route   DELETE /api/forums/posts/:id
// @access  Private
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const deleted = await deleteForumPost(id, userId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Forum post not found or unauthorized',
    });
  }

  res.json({
    success: true,
    message: 'Forum post deleted successfully',
  });
});

// @desc    Vote on a forum post
// @route   POST /api/forums/posts/:id/vote
// @access  Private
export const vote = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { voteType } = req.body;

  if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
    return res.status(400).json({
      success: false,
      message: 'Valid voteType (upvote or downvote) is required',
    });
  }

  const result = await voteOnPost(id, userId, voteType);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message,
    });
  }

  res.json({
    success: true,
    message: result.message,
  });
});

// @desc    Mark post as answer
// @route   POST /api/forums/posts/:id/mark-answer
// @access  Private
export const markAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { isAnswer = true } = req.body;

  const result = await markAsAnswer(id, userId, isAnswer);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message,
    });
  }

  res.json({
    success: true,
    message: result.message,
  });
});

// @desc    Pin/unpin a post
// @route   POST /api/forums/posts/:id/pin
// @access  Private/Admin
export const pin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const post = await togglePinPost(id, userId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Forum post not found',
    });
  }

  res.json({
    success: true,
    message: post.isPinned ? 'Post pinned' : 'Post unpinned',
    post,
  });
});

// @desc    Lock/unlock a post
// @route   POST /api/forums/posts/:id/lock
// @access  Private/Admin
export const lock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const post = await toggleLockPost(id, userId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Forum post not found',
    });
  }

  res.json({
    success: true,
    message: post.isLocked ? 'Post locked' : 'Post unlocked',
    post,
  });
});

// @desc    Get user's forum activity
// @route   GET /api/forums/activity
// @access  Private
export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { courseId } = req.query;

  const activity = await getUserForumActivity(userId, courseId as string);

  res.json({
    success: true,
    activity,
  });
});


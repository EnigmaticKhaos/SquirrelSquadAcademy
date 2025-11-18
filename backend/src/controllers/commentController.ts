import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment';
import Post from '../models/Post';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { moderateContent } from '../services/ai/moderationService';

// @desc    Get comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Public
export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  const comments = await Comment.find({ post: postId, parentComment: null })
    .populate('user', 'username profilePhoto')
    .populate('mentions', 'username')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: comments.length,
    comments,
  });
});

// @desc    Create comment
// @route   POST /api/posts/:postId/comments
// @access  Private
export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { content, parentComment, mentions } = req.body;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Comment content is required',
    });
  }

  // Moderate content
  const moderationResult = await moderateContent(content);
  if (moderationResult.isFlagged && moderationResult.severity === 'high') {
    return res.status(400).json({
      success: false,
      message: 'Comment contains inappropriate content',
    });
  }

  // Extract mentions
  const mentionRegex = /@(\w+)/g;
  const extractedMentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    extractedMentions.push(match[1]);
  }

  const comment = await Comment.create({
    user: userDoc._id,
    post: postId,
    content,
    parentComment,
    mentions: mentions || extractedMentions,
  });

  // Update post comment count
  await Post.findByIdAndUpdate(postId, {
    $inc: { commentsCount: 1 },
  });

  // Update parent comment reply count if nested
  if (parentComment) {
    await Comment.findByIdAndUpdate(parentComment, {
      $inc: { repliesCount: 1 },
    });
  }

  // Get post to notify post owner
  const post = await Post.findById(postId);

  // Send notification to post owner (if not the commenter)
  if (post && post.user.toString() !== userDoc._id.toString()) {
    import('../services/notificationService').then(({ createNotification }) => {
      createNotification(post.user.toString(), 'social_comment', {
        title: 'New comment on your post',
        message: `${userDoc.username} commented on your post`,
        actionUrl: `/posts/${postId}`,
        relatedUser: userDoc._id.toString(),
        relatedPost: postId,
        relatedComment: comment._id.toString(),
      }).catch((error) => {
        console.error('Error sending comment notification:', error);
      });
    });
  }

  // Send notifications to mentioned users
  if (extractedMentions.length > 0) {
    import('../services/notificationService').then(({ createNotification }) => {
      import('../utils/mentionUtils').then(({ extractAndResolveMentionsWithDetails }) => {
        extractAndResolveMentionsWithDetails(content).then((resolvedMentions) => {
          resolvedMentions.forEach((mention) => {
            if (mention.userId !== userDoc._id.toString()) {
              createNotification(mention.userId, 'social_mention', {
                title: 'You were mentioned',
                message: `${userDoc.username} mentioned you in a comment`,
                actionUrl: `/posts/${postId}`,
                relatedUser: userDoc._id.toString(),
                relatedPost: postId,
                relatedComment: comment._id.toString(),
                sendEmail: true,
              }).catch((error) => {
                console.error('Error sending mention notification:', error);
              });
            }
          });
        });
      });
    });
  }

  res.status(201).json({
    success: true,
    message: 'Comment created successfully',
    comment,
  });
});

// @desc    Like/Unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
export const likeComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { emoji = '👍' } = req.body;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id;

  const comment = await Comment.findById(id);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found',
    });
  }

  // Check if user owns the comment
  if (comment.user.toString() === userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot like your own comment',
    });
  }

  const Like = (await import('../models/Like')).default;
  const existingLike = await Like.findOne({
    user: userId,
    targetType: 'comment',
    targetId: id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    comment.likesCount = Math.max(0, comment.likesCount - 1);
    await comment.save();

    return res.json({
      success: true,
      message: 'Comment unliked',
      liked: false,
    });
  }

  await Like.create({
    user: userId,
    targetType: 'comment',
    targetId: id,
    emoji,
  });

  comment.likesCount += 1;
  await comment.save();

  // Send notification to comment owner
  import('../services/notificationService').then(({ createNotification }) => {
    createNotification(comment.user.toString(), 'social_like', {
      title: 'New like on your comment',
      message: `${userDoc.username} liked your comment`,
      actionUrl: `/posts/${comment.post}`,
      relatedUser: userId.toString(),
      relatedComment: id,
    }).catch((error) => {
      console.error('Error sending like notification:', error);
    });
  });

  res.json({
    success: true,
    message: 'Comment liked',
    liked: true,
  });
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const comment = await Comment.findById(id);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found',
    });
  }

  if (comment.user.toString() !== userDoc._id.toString() && userDoc.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this comment',
    });
  }

  // Update post comment count
  if (comment.post) {
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 },
    });
  }

  // Update parent comment reply count
  if (comment.parentComment) {
    await Comment.findByIdAndUpdate(comment.parentComment, {
      $inc: { repliesCount: -1 },
    });
  }

  await comment.deleteOne();

  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});


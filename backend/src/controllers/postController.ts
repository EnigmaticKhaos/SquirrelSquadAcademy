import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { moderateContent } from '../services/ai/moderationService';

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, userId } = req.query;

  const query: any = { isPublic: true };
  if (userId) query.user = userId;

  const skip = (Number(page) - 1) * Number(limit);

  const posts = await Post.find(query)
    .populate('user', 'username profilePhoto')
    .populate('sharedProject')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Post.countDocuments(query);

  res.json({
    success: true,
    count: posts.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    posts,
  });
});

// @desc    Create post
// @route   POST /api/posts
// @access  Private
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const { content, type, media, sharedProject, mentions } = req.body;

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
      message: 'Post content is required',
    });
  }

  // Moderate content
  const moderationResult = await moderateContent(content);
  if (moderationResult.isFlagged && moderationResult.severity === 'high') {
    return res.status(400).json({
      success: false,
      message: 'Post contains inappropriate content',
    });
  }

  // Extract mentions from content
  const mentionRegex = /@(\w+)/g;
  const extractedMentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    extractedMentions.push(match[1]);
  }

  const post = await Post.create({
    user: userDoc._id,
    content,
    type: type || 'text',
    media,
    sharedProject,
    mentions: mentions || extractedMentions,
  });

  // Check achievements, badges, goals, and challenges for post creation
  import('../services/achievementService').then(({ checkAchievementsForTrigger }) => {
    checkAchievementsForTrigger({
      userId: userDoc._id.toString(),
      triggerType: 'post_created',
      triggerData: { postId: post._id.toString() },
    }).catch((error) => {
      console.error('Error checking achievements:', error);
    });
  });
  import('../services/badgeService').then(({ checkBadgesForTrigger }) => {
    checkBadgesForTrigger({
      userId: userDoc._id.toString(),
      triggerType: 'post_created',
      triggerData: { postId: post._id.toString() },
    }).catch((error) => {
      console.error('Error checking badges:', error);
    });
  });
  import('../services/challengeService').then(({ checkChallengesForTrigger }) => {
    checkChallengesForTrigger(userDoc._id.toString(), 'post_created').catch((error) => {
      console.error('Error checking challenges:', error);
    });
  });

  // Send notifications to mentioned users
  if (extractedMentions.length > 0) {
    import('../services/notificationService').then(({ createNotification }) => {
      import('../utils/mentionUtils').then(({ extractAndResolveMentionsWithDetails }) => {
        extractAndResolveMentionsWithDetails(content).then((resolvedMentions) => {
          resolvedMentions.forEach((mention) => {
            if (mention.userId !== userDoc._id.toString()) {
              createNotification(mention.userId, 'social_mention', {
                title: 'You were mentioned',
                message: `${userDoc.username} mentioned you in a post`,
                actionUrl: `/posts/${post._id}`,
                relatedUser: userDoc._id.toString(),
                relatedPost: post._id.toString(),
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
    message: 'Post created successfully',
    post,
  });
});

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = asyncHandler(async (req: Request, res: Response) => {
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

  const post = await Post.findById(id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  // Check if user owns the post
  if (post.user.toString() === userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot like your own post',
    });
  }

  // Check if already liked
  const Like = (await import('../models/Like')).default;
  const existingLike = await Like.findOne({
    user: userId,
    targetType: 'post',
    targetId: id,
  });

  if (existingLike) {
    // Unlike
    await Like.findByIdAndDelete(existingLike._id);
    post.likesCount = Math.max(0, post.likesCount - 1);
    await post.save();

    return res.json({
      success: true,
      message: 'Post unliked',
      liked: false,
    });
  }

  // Like
  await Like.create({
    user: userId,
    targetType: 'post',
    targetId: id,
    emoji,
  });

  post.likesCount += 1;
  await post.save();

  // Award XP to post owner for receiving a like
  const { awardXP, XP_AMOUNTS } = await import('../services/xpService');
  await awardXP({
    userId: post.user.toString(),
    amount: XP_AMOUNTS.LIKE_RECEIVED,
    source: 'like_received',
    sourceId: id,
    description: 'Received a like on post',
  });

  // Send notification to post owner
  import('../services/notificationService').then(({ createNotification }) => {
    createNotification(post.user.toString(), 'social_like', {
      title: 'New like on your post',
      message: `${userDoc.username} liked your post`,
      actionUrl: `/posts/${id}`,
      relatedUser: userId.toString(),
      relatedPost: id,
    }).catch((error) => {
      console.error('Error sending like notification:', error);
    });
  });

  // Check achievements, badges, goals, and challenges for like received
  import('../services/achievementService').then(({ checkAchievementsForTrigger }) => {
    checkAchievementsForTrigger({
      userId: post.user.toString(),
      triggerType: 'like_received',
      triggerData: { postId: id },
    }).catch((error) => {
      console.error('Error checking achievements:', error);
    });
  });
  import('../services/badgeService').then(({ checkBadgesForTrigger }) => {
    checkBadgesForTrigger({
      userId: post.user.toString(),
      triggerType: 'like_received',
      triggerData: { postId: id },
    }).catch((error) => {
      console.error('Error checking badges:', error);
    });
  });
  import('../services/challengeService').then(({ checkChallengesForTrigger }) => {
    checkChallengesForTrigger(post.user.toString(), 'like_received').catch((error) => {
      console.error('Error checking challenges:', error);
    });
  });

  res.json({
    success: true,
    message: 'Post liked',
    liked: true,
  });
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const post = await Post.findById(id)
    .populate('user', 'username profilePhoto')
    .populate('sharedProject')
    .populate('mentions', 'username');

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  res.json({
    success: true,
    post,
  });
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const post = await Post.findById(id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  // Check if user owns the post or is admin
  if (post.user.toString() !== userDoc._id.toString() && userDoc.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this post',
    });
  }

  await post.deleteOne();

  res.json({
    success: true,
    message: 'Post deleted successfully',
  });
});


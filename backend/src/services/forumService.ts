import ForumPost, { IForumPost } from '../models/ForumPost';
import ForumVote from '../models/ForumVote';
import Course from '../models/Course';
import { extractAndResolveMentions, extractAndResolveMentionsWithDetails } from '../utils/mentionUtils';
import logger from '../utils/logger';

/**
 * Create a forum post
 */
export const createForumPost = async (
  userId: string,
  data: {
    courseId: string;
    type: 'question' | 'discussion' | 'announcement';
    title: string;
    content: string;
    parentPostId?: string;
    tags?: string[];
  }
): Promise<IForumPost> => {
  try {
    const course = await Course.findById(data.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Extract and resolve mentions from content
    const mentions = await extractAndResolveMentions(data.content);

    const postData: any = {
      course: data.courseId,
      author: userId,
      type: data.type,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      mentions,
    };

    if (data.parentPostId) {
      postData.parentPost = data.parentPostId;
      
      // Get parent post to notify author
      const parentPost = await ForumPost.findById(data.parentPostId).populate('author');
      
      // Increment parent post replies count
      await ForumPost.findByIdAndUpdate(data.parentPostId, {
        $inc: { repliesCount: 1 },
        lastActivityAt: new Date(),
      });

      // Send notification to parent post author (if not the replier)
      if (parentPost && (parentPost.author as any)._id.toString() !== userId) {
        import('./notificationService').then(({ createNotification }) => {
          createNotification((parentPost.author as any)._id.toString(), 'forum_reply', {
            title: 'New reply to your forum post',
            message: `Someone replied to your forum post: "${parentPost.title}"`,
            actionUrl: `/courses/${data.courseId}/forum/${data.parentPostId}`,
            relatedForumPost: data.parentPostId,
            relatedCourse: data.courseId,
            sendEmail: true,
          }).catch((error) => {
            logger.error('Error sending forum reply notification:', error);
          });
        });
      }
    }

    const post = await ForumPost.create(postData);

    // Send notifications to mentioned users
    if (mentions.length > 0) {
      import('./notificationService').then(({ createNotification }) => {
        import('../models/User').then(({ default: User }) => {
          User.find({ _id: { $in: mentions } }).then((mentionedUsers) => {
            mentionedUsers.forEach((mentionedUser) => {
              if (mentionedUser._id.toString() !== userId) {
                createNotification(mentionedUser._id.toString(), 'forum_mention', {
                  title: 'You were mentioned in a forum post',
                  message: `You were mentioned in a forum post: "${data.title}"`,
                  actionUrl: `/courses/${data.courseId}/forum/${post._id}`,
                  relatedForumPost: post._id.toString(),
                  relatedCourse: data.courseId,
                  sendEmail: true,
                }).catch((error) => {
                  logger.error('Error sending forum mention notification:', error);
                });
              }
            });
          });
        });
      });
    }

    logger.info(`Forum post created: ${post._id} by user ${userId}`);
    return post;
  } catch (error) {
    logger.error('Error creating forum post:', error);
    throw error;
  }
};

/**
 * Get forum posts for a course
 */
export const getCourseForumPosts = async (
  courseId: string,
  options?: {
    type?: 'question' | 'discussion' | 'announcement';
    parentPostId?: string | null; // null for top-level posts only
    tags?: string[];
    search?: string;
    sortBy?: 'newest' | 'oldest' | 'most_voted' | 'most_replied' | 'recent_activity';
    limit?: number;
    offset?: number;
  }
): Promise<{ posts: IForumPost[]; total: number }> => {
  try {
    const query: any = { course: courseId };

    if (options?.type) {
      query.type = options.type;
    }

    if (options?.parentPostId !== undefined) {
      if (options.parentPostId === null) {
        query.parentPost = { $exists: false };
      } else {
        query.parentPost = options.parentPostId;
      }
    } else {
      // Default to top-level posts only
      query.parentPost = { $exists: false };
    }

    if (options?.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }

    if (options?.search) {
      query.$text = { $search: options.search };
    }

    const total = await ForumPost.countDocuments(query);

    let sortOptions: any = {};
    switch (options?.sortBy) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'most_voted':
        sortOptions = { upvotes: -1, createdAt: -1 };
        break;
      case 'most_replied':
        sortOptions = { repliesCount: -1, createdAt: -1 };
        break;
      case 'recent_activity':
        sortOptions = { lastActivityAt: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { isPinned: -1, createdAt: -1 };
        break;
    }

    const posts = await ForumPost.find(query)
      .populate('author', 'username profilePhoto level')
      .populate('parentPost', 'title')
      .sort(sortOptions)
      .skip(options?.offset || 0)
      .limit(options?.limit || 20);

    return { posts, total };
  } catch (error) {
    logger.error('Error getting course forum posts:', error);
    return { posts: [], total: 0 };
  }
};

/**
 * Get a single forum post with replies
 */
export const getForumPost = async (
  postId: string
): Promise<IForumPost | null> => {
  try {
    const post = await ForumPost.findById(postId)
      .populate('author', 'username profilePhoto level bio')
      .populate('parentPost', 'title content author')
      .populate('mentions', 'username profilePhoto');

    if (post) {
      // Increment views
      post.views += 1;
      await post.save();
    }

    return post;
  } catch (error) {
    logger.error('Error getting forum post:', error);
    return null;
  }
};

/**
 * Get replies to a post
 */
export const getPostReplies = async (
  postId: string,
  options?: {
    sortBy?: 'newest' | 'oldest' | 'most_voted' | 'helpful';
    limit?: number;
    offset?: number;
  }
): Promise<{ replies: IForumPost[]; total: number }> => {
  try {
    const query = { parentPost: postId };

    const total = await ForumPost.countDocuments(query);

    let sortOptions: any = {};
    switch (options?.sortBy) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'most_voted':
        sortOptions = { upvotes: -1, createdAt: -1 };
        break;
      case 'helpful':
        sortOptions = { markedAsHelpful: -1, upvotes: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const replies = await ForumPost.find(query)
      .populate('author', 'username profilePhoto level')
      .sort(sortOptions)
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { replies, total };
  } catch (error) {
    logger.error('Error getting post replies:', error);
    return { replies: [], total: 0 };
  }
};

/**
 * Update a forum post
 */
export const updateForumPost = async (
  postId: string,
  userId: string,
  updates: {
    title?: string;
    content?: string;
    tags?: string[];
    isPinned?: boolean;
    isLocked?: boolean;
  }
): Promise<IForumPost | null> => {
  try {
    const post = await ForumPost.findById(postId);
    if (!post) {
      return null;
    }

    // Check if user is author or admin
    if (post.author.toString() !== userId && !(await isAdmin(userId))) {
      throw new Error('Unauthorized to update this post');
    }

    // Extract and resolve mentions if content is updated
    if (updates.content) {
      const mentions = await extractAndResolveMentions(updates.content);
      (updates as any).mentions = mentions;
    }

    const updatedPost = await ForumPost.findByIdAndUpdate(
      postId,
      { ...updates, lastActivityAt: new Date() },
      { new: true, runValidators: true }
    );

    return updatedPost;
  } catch (error) {
    logger.error('Error updating forum post:', error);
    throw error;
  }
};

/**
 * Delete a forum post
 */
export const deleteForumPost = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  try {
    const post = await ForumPost.findById(postId);
    if (!post) {
      return false;
    }

    // Check if user is author or admin
    if (post.author.toString() !== userId && !(await isAdmin(userId))) {
      throw new Error('Unauthorized to delete this post');
    }

    // If it's a parent post, delete all replies
    if (!post.parentPost) {
      await ForumPost.deleteMany({ parentPost: postId });
    } else {
      // Decrement parent post replies count
      await ForumPost.findByIdAndUpdate(post.parentPost, {
        $inc: { repliesCount: -1 },
      });
    }

    await ForumPost.findByIdAndDelete(postId);
    await ForumVote.deleteMany({ post: postId });

    logger.info(`Forum post deleted: ${postId} by user ${userId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting forum post:', error);
    throw error;
  }
};

/**
 * Vote on a forum post
 */
export const voteOnPost = async (
  postId: string,
  userId: string,
  voteType: 'upvote' | 'downvote'
): Promise<{ success: boolean; message: string }> => {
  try {
    const post = await ForumPost.findById(postId);
    if (!post) {
      return { success: false, message: 'Post not found' };
    }

    // Users cannot vote on their own posts
    if (post.author.toString() === userId) {
      return { success: false, message: 'Cannot vote on your own post' };
    }

    const existingVote = await ForumVote.findOne({
      user: userId,
      post: postId,
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote
        await ForumVote.findByIdAndDelete(existingVote._id);
        await ForumPost.findByIdAndUpdate(postId, {
          $inc: { [voteType === 'upvote' ? 'upvotes' : 'downvotes']: -1 },
        });
        return { success: true, message: 'Vote removed' };
      } else {
        // Change vote
        existingVote.voteType = voteType;
        await existingVote.save();
        await ForumPost.findByIdAndUpdate(postId, {
          $inc: {
            [voteType === 'upvote' ? 'upvotes' : 'downvotes']: 1,
            [voteType === 'upvote' ? 'downvotes' : 'upvotes']: -1,
          },
        });
        return { success: true, message: 'Vote updated' };
      }
    } else {
      // Create new vote
      await ForumVote.create({
        user: userId,
        post: postId,
        voteType,
      });
      await ForumPost.findByIdAndUpdate(postId, {
        $inc: { [voteType === 'upvote' ? 'upvotes' : 'downvotes']: 1 },
      });
      return { success: true, message: 'Vote recorded' };
    }
  } catch (error) {
    logger.error('Error voting on post:', error);
    return { success: false, message: 'Error voting on post' };
  }
};

/**
 * Mark post as answer/helpful
 */
export const markAsAnswer = async (
  postId: string,
  userId: string,
  isAnswer: boolean
): Promise<{ success: boolean; message: string }> => {
  try {
    const post = await ForumPost.findById(postId).populate('parentPost');
    if (!post || !post.parentPost) {
      return { success: false, message: 'Post or parent post not found' };
    }

    const parentPost = post.parentPost as any;
    
    // Only the author of the parent post can mark answers
    if (parentPost.author.toString() !== userId) {
      return { success: false, message: 'Only the question author can mark answers' };
    }

    post.isAnswer = isAnswer;
    post.markedAsHelpful = isAnswer;
    
    if (isAnswer) {
      // Mark parent post as resolved
      await ForumPost.findByIdAndUpdate(parentPost._id, {
        isResolved: true,
      });
    }
    
    await post.save();

    return { success: true, message: isAnswer ? 'Marked as answer' : 'Unmarked as answer' };
  } catch (error) {
    logger.error('Error marking post as answer:', error);
    return { success: false, message: 'Error marking post as answer' };
  }
};

/**
 * Pin/unpin a post (admin/instructor only)
 */
export const togglePinPost = async (
  postId: string,
  userId: string
): Promise<IForumPost | null> => {
  try {
    if (!(await isAdmin(userId))) {
      throw new Error('Unauthorized: Admin access required');
    }

    const post = await ForumPost.findById(postId);
    if (!post) {
      return null;
    }

    post.isPinned = !post.isPinned;
    await post.save();

    return post;
  } catch (error) {
    logger.error('Error toggling post pin:', error);
    throw error;
  }
};

/**
 * Lock/unlock a post (admin/instructor only)
 */
export const toggleLockPost = async (
  postId: string,
  userId: string
): Promise<IForumPost | null> => {
  try {
    if (!(await isAdmin(userId))) {
      throw new Error('Unauthorized: Admin access required');
    }

    const post = await ForumPost.findById(postId);
    if (!post) {
      return null;
    }

    post.isLocked = !post.isLocked;
    await post.save();

    return post;
  } catch (error) {
    logger.error('Error toggling post lock:', error);
    throw error;
  }
};

/**
 * Check if user is admin
 */
const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const User = (await import('../models/User')).default;
    const user = await User.findById(userId).select('role');
    return user?.role === 'admin';
  } catch (error) {
    return false;
  }
};

/**
 * Get user's forum activity
 */
export const getUserForumActivity = async (
  userId: string,
  courseId?: string
): Promise<{
  posts: number;
  replies: number;
  upvotes: number;
  helpfulAnswers: number;
}> => {
  try {
    const query: any = { author: userId };
    if (courseId) {
      query.course = courseId;
    }

    const posts = await ForumPost.countDocuments({ ...query, parentPost: { $exists: false } });
    const replies = await ForumPost.countDocuments({ ...query, parentPost: { $exists: true } });
    const helpfulAnswers = await ForumPost.countDocuments({ ...query, markedAsHelpful: true });
    const upvotes = await ForumVote.countDocuments({ user: userId, voteType: 'upvote' });

    return {
      posts,
      replies,
      upvotes,
      helpfulAnswers,
    };
  } catch (error) {
    logger.error('Error getting user forum activity:', error);
    return { posts: 0, replies: 0, upvotes: 0, helpfulAnswers: 0 };
  }
};


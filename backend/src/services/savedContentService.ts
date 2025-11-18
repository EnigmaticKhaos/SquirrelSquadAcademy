import SavedContent from '../models/SavedContent';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Post from '../models/Post';
import Project from '../models/Project';
import ForumPost from '../models/ForumPost';
import logger from '../utils/logger';

/**
 * Get the model name for a content type
 */
const getModelName = (contentType: string): string => {
  const modelMap: { [key: string]: string } = {
    course: 'Course',
    lesson: 'Lesson',
    post: 'Post',
    project: 'Project',
    forum_post: 'ForumPost',
  };
  return modelMap[contentType] || 'Course';
};

/**
 * Verify content exists
 */
const verifyContentExists = async (
  contentType: string,
  contentId: string
): Promise<boolean> => {
  try {
    const modelName = getModelName(contentType);
    let Model;
    
    switch (modelName) {
      case 'Course':
        Model = Course;
        break;
      case 'Lesson':
        Model = Lesson;
        break;
      case 'Post':
        Model = Post;
        break;
      case 'Project':
        Model = Project;
        break;
      case 'ForumPost':
        Model = ForumPost;
        break;
      default:
        return false;
    }

    const content = await Model.findById(contentId);
    return !!content;
  } catch (error) {
    logger.error('Error verifying content exists:', error);
    return false;
  }
};

/**
 * Save content
 */
export const saveContent = async (
  userId: string,
  data: {
    contentType: 'course' | 'lesson' | 'post' | 'project' | 'forum_post';
    contentId: string;
    folder?: string;
    tags?: string[];
    notes?: string;
  }
): Promise<SavedContent> => {
  try {
    // Verify content exists
    const exists = await verifyContentExists(data.contentType, data.contentId);
    if (!exists) {
      throw new Error('Content not found');
    }

    // Check if already saved
    const existing = await SavedContent.findOne({
      user: userId,
      contentType: data.contentType,
      contentId: data.contentId,
    });

    if (existing) {
      // Update existing saved content
      if (data.folder !== undefined) existing.folder = data.folder;
      if (data.tags !== undefined) existing.tags = data.tags;
      if (data.notes !== undefined) existing.notes = data.notes;
      await existing.save();
      return existing;
    }

    // Create new saved content
    const savedContent = await SavedContent.create({
      user: userId,
      contentType: data.contentType,
      contentTypeModel: getModelName(data.contentType),
      contentId: data.contentId,
      folder: data.folder,
      tags: data.tags || [],
      notes: data.notes,
    });

    logger.info(`Content saved: ${data.contentType} ${data.contentId} by user ${userId}`);
    return savedContent;
  } catch (error) {
    logger.error('Error saving content:', error);
    throw error;
  }
};

/**
 * Unsave/remove saved content
 */
export const unsaveContent = async (
  userId: string,
  contentType: string,
  contentId: string
): Promise<boolean> => {
  try {
    const result = await SavedContent.findOneAndDelete({
      user: userId,
      contentType,
      contentId,
    });

    if (result) {
      logger.info(`Content unsaved: ${contentType} ${contentId} by user ${userId}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error unsaving content:', error);
    throw error;
  }
};

/**
 * Check if content is saved
 */
export const isContentSaved = async (
  userId: string,
  contentType: string,
  contentId: string
): Promise<boolean> => {
  try {
    const saved = await SavedContent.findOne({
      user: userId,
      contentType,
      contentId,
    });
    return !!saved;
  } catch (error) {
    logger.error('Error checking if content is saved:', error);
    return false;
  }
};

/**
 * Get saved content for a user
 */
export const getUserSavedContent = async (
  userId: string,
  options?: {
    contentType?: 'course' | 'lesson' | 'post' | 'project' | 'forum_post';
    folder?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }
): Promise<{ savedContent: SavedContent[]; total: number }> => {
  try {
    const query: any = { user: userId };

    if (options?.contentType) {
      query.contentType = options.contentType;
    }

    if (options?.folder) {
      query.folder = options.folder;
    }

    if (options?.tags && options.tags.length > 0) {
      query.tags = { $in: options.tags };
    }

    const total = await SavedContent.countDocuments(query);

    const savedContent = await SavedContent.find(query)
      .sort({ savedAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    // Populate content based on type
    const populatedContent = await Promise.all(
      savedContent.map(async (item) => {
        const content = item.toObject();
        try {
          const modelName = getModelName(item.contentType);
          let Model;
          
          switch (modelName) {
            case 'Course':
              Model = Course;
              break;
            case 'Lesson':
              Model = Lesson;
              break;
            case 'Post':
              Model = Post;
              break;
            case 'Project':
              Model = Project;
              break;
            case 'ForumPost':
              Model = ForumPost;
              break;
            default:
              return content;
          }

          const populated = await Model.findById(item.contentId)
            .select('title description thumbnail username profilePhoto content');
          
          if (populated) {
            content.content = populated;
          }
        } catch (error) {
          logger.error('Error populating saved content:', error);
        }
        return content;
      })
    );

    return { savedContent: populatedContent as any, total };
  } catch (error) {
    logger.error('Error getting user saved content:', error);
    return { savedContent: [], total: 0 };
  }
};

/**
 * Get saved content by type
 */
export const getSavedContentByType = async (
  userId: string,
  contentType: 'course' | 'lesson' | 'post' | 'project' | 'forum_post',
  options?: {
    folder?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }
): Promise<{ savedContent: SavedContent[]; total: number }> => {
  return getUserSavedContent(userId, {
    ...options,
    contentType,
  });
};

/**
 * Update saved content
 */
export const updateSavedContent = async (
  savedContentId: string,
  userId: string,
  updates: {
    folder?: string;
    tags?: string[];
    notes?: string;
  }
): Promise<SavedContent | null> => {
  try {
    const savedContent = await SavedContent.findOneAndUpdate(
      { _id: savedContentId, user: userId },
      updates,
      { new: true, runValidators: true }
    );

    return savedContent;
  } catch (error) {
    logger.error('Error updating saved content:', error);
    throw error;
  }
};

/**
 * Get user's saved content folders
 */
export const getUserFolders = async (userId: string): Promise<string[]> => {
  try {
    const savedContent = await SavedContent.find({ user: userId })
      .select('folder')
      .distinct('folder');

    return savedContent.filter((folder) => folder !== null && folder !== undefined) as string[];
  } catch (error) {
    logger.error('Error getting user folders:', error);
    return [];
  }
};

/**
 * Get user's saved content tags
 */
export const getUserSavedContentTags = async (userId: string): Promise<string[]> => {
  try {
    const savedContent = await SavedContent.find({ user: userId }).select('tags');
    const allTags = savedContent.flatMap((item) => item.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.sort();
  } catch (error) {
    logger.error('Error getting user saved content tags:', error);
    return [];
  }
};

/**
 * Get saved content statistics
 */
export const getSavedContentStats = async (
  userId: string
): Promise<{
  total: number;
  byType: { [key: string]: number };
  byFolder: { [key: string]: number };
}> => {
  try {
    const total = await SavedContent.countDocuments({ user: userId });

    const byType = await SavedContent.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$contentType',
          count: { $sum: 1 },
        },
      },
    ]);

    const byFolder = await SavedContent.aggregate([
      { $match: { user: userId, folder: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$folder',
          count: { $sum: 1 },
        },
      },
    ]);

    const byTypeMap: { [key: string]: number } = {};
    byType.forEach((item) => {
      byTypeMap[item._id] = item.count;
    });

    const byFolderMap: { [key: string]: number } = {};
    byFolder.forEach((item) => {
      byFolderMap[item._id] = item.count;
    });

    return {
      total,
      byType: byTypeMap,
      byFolder: byFolderMap,
    };
  } catch (error) {
    logger.error('Error getting saved content stats:', error);
    return { total: 0, byType: {}, byFolder: {} };
  }
};


import Resource from '../models/Resource';
import SavedResource from '../models/SavedResource';
import { awardXP } from './xpService';
import logger from '../utils/logger';

/**
 * Create a resource
 */
export const createResource = async (
  userId: string,
  data: {
    title: string;
    description?: string;
    resourceType: 'article' | 'video' | 'document' | 'book' | 'course' | 'tool' | 'website' | 'other';
    category: string;
    url: string;
    thumbnail?: string;
    author?: string;
    publisher?: string;
    publishedDate?: Date;
    language?: string;
    tags?: string[];
    duration?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    isFree: boolean;
    cost?: number;
    currency?: string;
    courseId?: string;
    lessonId?: string;
    isPublic?: boolean;
  },
  isAdmin: boolean = false
): Promise<any> => {
  try {
    const resource = await Resource.create({
      user: isAdmin ? undefined : userId,
      createdBy: userId,
      title: data.title,
      description: data.description,
      resourceType: data.resourceType,
      category: data.category,
      url: data.url,
      thumbnail: data.thumbnail,
      author: data.author,
      publisher: data.publisher,
      publishedDate: data.publishedDate,
      language: data.language || 'en',
      tags: data.tags,
      duration: data.duration,
      difficulty: data.difficulty,
      isFree: data.isFree,
      cost: data.cost,
      currency: data.currency,
      course: data.courseId,
      lesson: data.lessonId,
      isPublic: data.isPublic || false,
      isVerified: isAdmin, // Admin-created resources are auto-verified
    });

    logger.info(`Resource created: ${resource._id} by user ${userId}`);
    return resource;
  } catch (error) {
    logger.error('Error creating resource:', error);
    throw error;
  }
};

/**
 * Save a resource for user
 */
export const saveResource = async (
  userId: string,
  resourceId: string,
  folder?: string,
  tags?: string[],
  notes?: string
): Promise<any> => {
  try {
    // Check if already saved
    const existing = await SavedResource.findOne({
      user: userId,
      resource: resourceId,
    });

    if (existing) {
      // Update existing saved resource
      if (folder !== undefined) existing.folder = folder;
      if (tags !== undefined) existing.tags = tags;
      if (notes !== undefined) existing.notes = notes;
      await existing.save();
      return existing;
    }

    // Create new saved resource
    const savedResource = await SavedResource.create({
      user: userId,
      resource: resourceId,
      folder,
      tags,
      notes,
    });

    // Update resource save count
    await Resource.findByIdAndUpdate(resourceId, {
      $inc: { saveCount: 1 },
    });

    logger.info(`Resource saved: ${resourceId} by user ${userId}`);
    return savedResource;
  } catch (error) {
    logger.error('Error saving resource:', error);
    throw error;
  }
};

/**
 * Unsave a resource
 */
export const unsaveResource = async (
  userId: string,
  resourceId: string
): Promise<void> => {
  try {
    const savedResource = await SavedResource.findOneAndDelete({
      user: userId,
      resource: resourceId,
    });

    if (savedResource) {
      // Update resource save count
      await Resource.findByIdAndUpdate(resourceId, {
        $inc: { saveCount: -1 },
      });
    }

    logger.info(`Resource unsaved: ${resourceId} by user ${userId}`);
  } catch (error) {
    logger.error('Error unsaving resource:', error);
    throw error;
  }
};

/**
 * Get user's saved resources
 */
export const getSavedResources = async (
  userId: string,
  folder?: string
): Promise<any[]> => {
  try {
    const query: any = { user: userId };
    if (folder) {
      query.folder = folder;
    }

    const savedResources = await SavedResource.find(query)
      .populate('resource')
      .sort({ savedAt: -1 });

    return savedResources;
  } catch (error) {
    logger.error('Error getting saved resources:', error);
    throw error;
  }
};

/**
 * Track resource view
 */
export const trackResourceView = async (
  resourceId: string,
  userId?: string
): Promise<void> => {
  try {
    await Resource.findByIdAndUpdate(resourceId, {
      $inc: { viewCount: 1 },
    });

    // Update last viewed if user is logged in
    if (userId) {
      await SavedResource.findOneAndUpdate(
        { user: userId, resource: resourceId },
        {
          $inc: { viewCount: 1 },
          $set: { lastViewed: new Date() },
        },
        { upsert: false }
      );
    }
  } catch (error) {
    logger.error('Error tracking resource view:', error);
  }
};


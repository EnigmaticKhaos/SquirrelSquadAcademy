import Lesson from '../models/Lesson';
import VideoProgress from '../models/VideoProgress';
import { extractYouTubeVideoId, getYouTubeThumbnail, getYouTubeEmbedUrl } from '../utils/youtubeUtils';
import { uploadVideo, generateVideoThumbnail } from './cloudinaryService';
import logger from '../utils/logger';
import { awardXP } from './xpService';

/**
 * Update video progress
 */
export const updateVideoProgress = async (
  userId: string,
  lessonId: string,
  progress: {
    currentTime: number;
    duration: number;
    playbackSpeed?: number;
    volume?: number;
    muted?: boolean;
    captionsEnabled?: boolean;
    captionsLanguage?: string;
  }
): Promise<VideoProgress> => {
  try {
    const progressPercentage = progress.duration > 0
      ? Math.round((progress.currentTime / progress.duration) * 100)
      : 0;

    const completed = progressPercentage >= 90; // Consider 90% as completed

    const videoProgress = await VideoProgress.findOneAndUpdate(
      { user: userId, lesson: lessonId },
      {
        currentTime: progress.currentTime,
        duration: progress.duration,
        progressPercentage,
        completed,
        playbackSpeed: progress.playbackSpeed || 1.0,
        volume: progress.volume !== undefined ? progress.volume : 1.0,
        muted: progress.muted !== undefined ? progress.muted : false,
        captionsEnabled: progress.captionsEnabled !== undefined ? progress.captionsEnabled : false,
        captionsLanguage: progress.captionsLanguage,
        lastWatchedAt: new Date(),
        ...(completed && !(await VideoProgress.findOne({ user: userId, lesson: lessonId }))?.completed
          ? { completedAt: new Date(), watchedAt: new Date() }
          : {}),
      },
      { upsert: true, new: true }
    );

    // Award XP for watching video (only once when completed)
    if (completed && !videoProgress.completed) {
      await awardXP({
        userId,
        amount: 50, // XP for completing a video lesson
        source: 'video_watched',
        sourceId: lessonId,
        description: 'Watched video lesson',
      });
    }

    return videoProgress;
  } catch (error) {
    logger.error('Error updating video progress:', error);
    throw error;
  }
};

/**
 * Get video progress for a user and lesson
 */
export const getVideoProgress = async (
  userId: string,
  lessonId: string
): Promise<VideoProgress | null> => {
  try {
    return await VideoProgress.findOne({
      user: userId,
      lesson: lessonId,
    });
  } catch (error) {
    logger.error('Error getting video progress:', error);
    return null;
  }
};

/**
 * Process YouTube URL and extract video ID
 */
export const processYouTubeUrl = async (
  lessonId: string,
  youtubeUrl: string
): Promise<{ videoId: string; thumbnail: string; embedUrl: string }> => {
  try {
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const thumbnail = getYouTubeThumbnail(videoId);
    const embedUrl = getYouTubeEmbedUrl(videoId, {
      controls: true,
    });

    // Update lesson with video ID and thumbnail
    await Lesson.findByIdAndUpdate(lessonId, {
      videoId,
      videoThumbnail: thumbnail,
    });

    return { videoId, thumbnail, embedUrl };
  } catch (error) {
    logger.error('Error processing YouTube URL:', error);
    throw error;
  }
};

/**
 * Upload video file to Cloudinary
 */
export const uploadVideoFile = async (
  lessonId: string,
  file: Buffer,
  filename: string
): Promise<{ url: string; publicId: string; thumbnail: string; duration?: number }> => {
  try {
    const uploadResult = await uploadVideo({
      file,
      folder: `squirrelsquadacademy/lessons/${lessonId}`,
      resourceType: 'video',
    });

    // Generate thumbnail
    const thumbnail = await generateVideoThumbnail(uploadResult.public_id);

    // Update lesson with video URL and thumbnail
    await Lesson.findByIdAndUpdate(lessonId, {
      videoUrl: uploadResult.secure_url,
      videoThumbnail: thumbnail,
      videoDuration: uploadResult.duration,
    });

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      thumbnail,
      duration: uploadResult.duration,
    };
  } catch (error) {
    logger.error('Error uploading video file:', error);
    throw error;
  }
};

/**
 * Get video playback URL with options
 */
export const getVideoPlaybackUrl = async (
  lessonId: string,
  options?: {
    format?: string;
    quality?: string;
    startOffset?: number;
  }
): Promise<string | null> => {
  try {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || !lesson.hasVideo || !lesson.videoUrl) {
      return null;
    }

    if (lesson.videoSource === 'youtube') {
      // For YouTube, return embed URL
      if (lesson.videoId) {
        return getYouTubeEmbedUrl(lesson.videoId, {
          controls: true,
          start: options?.startOffset,
        });
      }
      return lesson.videoUrl;
    } else {
      // For Cloudinary uploads, generate optimized URL
      // Extract public_id from URL if needed
      // For now, return the stored URL
      return lesson.videoUrl;
    }
  } catch (error) {
    logger.error('Error getting video playback URL:', error);
    return null;
  }
};


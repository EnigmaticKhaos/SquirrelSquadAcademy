import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  updateVideoProgress,
  getVideoProgress,
  processYouTubeUrl,
  uploadVideoFile,
  getVideoPlaybackUrl,
} from '../services/videoService';
import Lesson from '../models/Lesson';
import { isValidYouTubeUrl } from '../utils/youtubeUtils';

// @desc    Update video progress
// @route   POST /api/videos/:lessonId/progress
// @access  Private
export const updateProgress = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { currentTime, duration, playbackSpeed, volume, muted, captionsEnabled, captionsLanguage } = req.body;

  if (!currentTime || !duration) {
    return res.status(400).json({
      success: false,
      message: 'Current time and duration are required',
    });
  }

  const progress = await updateVideoProgress(userId, lessonId, {
    currentTime,
    duration,
    playbackSpeed,
    volume,
    muted,
    captionsEnabled,
    captionsLanguage,
  });

  res.json({
    success: true,
    progress,
  });
});

// @desc    Get video progress
// @route   GET /api/videos/:lessonId/progress
// @access  Private
export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const progress = await getVideoProgress(userId, lessonId);

  res.json({
    success: true,
    progress: progress || null,
  });
});

// @desc    Upload video file
// @route   POST /api/videos/:lessonId/upload
// @access  Private/Admin
export const uploadVideo = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Video file is required',
    });
  }

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
  }

  const result = await uploadVideoFile(lessonId, req.file.buffer, req.file.originalname);

  // Update lesson
  lesson.hasVideo = true;
  lesson.videoSource = 'upload';
  lesson.videoUrl = result.url;
  lesson.videoThumbnail = result.thumbnail;
  if (result.duration) {
    lesson.videoDuration = result.duration;
  }
  await lesson.save();

  res.json({
    success: true,
    message: 'Video uploaded successfully',
    video: {
      url: result.url,
      thumbnail: result.thumbnail,
      duration: result.duration,
    },
  });
});

// @desc    Set YouTube video URL
// @route   POST /api/videos/:lessonId/youtube
// @access  Private/Admin
export const setYouTubeVideo = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const { youtubeUrl } = req.body;

  if (!youtubeUrl) {
    return res.status(400).json({
      success: false,
      message: 'YouTube URL is required',
    });
  }

  if (!isValidYouTubeUrl(youtubeUrl)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid YouTube URL',
    });
  }

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
  }

  const { videoId, thumbnail, embedUrl } = await processYouTubeUrl(lessonId, youtubeUrl);

  // Update lesson
  lesson.hasVideo = true;
  lesson.videoSource = 'youtube';
  lesson.videoUrl = youtubeUrl;
  lesson.videoId = videoId;
  lesson.videoThumbnail = thumbnail;
  await lesson.save();

  res.json({
    success: true,
    message: 'YouTube video added successfully',
    video: {
      videoId,
      thumbnail,
      embedUrl,
      url: youtubeUrl,
    },
  });
});

// @desc    Get video playback URL
// @route   GET /api/videos/:lessonId/playback
// @access  Private
export const getPlaybackUrl = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const { format, quality, startOffset } = req.query;

  const playbackUrl = await getVideoPlaybackUrl(lessonId, {
    format: format as string,
    quality: quality as string,
    startOffset: startOffset ? Number(startOffset) : undefined,
  });

  if (!playbackUrl) {
    return res.status(404).json({
      success: false,
      message: 'Video not found or not available',
    });
  }

  res.json({
    success: true,
    playbackUrl,
  });
});

// @desc    Update video settings (transcript, captions, etc.)
// @route   PUT /api/videos/:lessonId/settings
// @access  Private/Admin
export const updateVideoSettings = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const { videoTranscript, videoCaptions, allowDownload, playbackSpeedOptions, interactiveQuizData } = req.body;

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
  }

  if (videoTranscript !== undefined) {
    lesson.videoTranscript = videoTranscript;
  }

  if (videoCaptions !== undefined) {
    lesson.videoCaptions = videoCaptions;
  }

  if (allowDownload !== undefined) {
    lesson.allowDownload = allowDownload;
  }

  if (playbackSpeedOptions !== undefined) {
    lesson.playbackSpeedOptions = playbackSpeedOptions;
  }

  if (interactiveQuizData !== undefined) {
    lesson.hasInteractiveQuiz = interactiveQuizData && interactiveQuizData.length > 0;
    lesson.interactiveQuizData = interactiveQuizData;
  }

  await lesson.save();

  res.json({
    success: true,
    message: 'Video settings updated successfully',
    lesson,
  });
});


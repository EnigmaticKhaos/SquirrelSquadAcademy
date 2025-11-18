import express from 'express';
import multer from 'multer';
import {
  updateProgress,
  getProgress,
  uploadVideo,
  setYouTubeVideo,
  getPlaybackUrl,
  updateVideoSettings,
} from '../controllers/videoController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Configure multer for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// Private routes
router.post('/:lessonId/progress', protect, updateProgress);
router.get('/:lessonId/progress', protect, getProgress);
router.get('/:lessonId/playback', protect, getPlaybackUrl);

// Admin routes
router.post('/:lessonId/upload', protect, authorize('admin'), upload.single('video'), uploadVideo);
router.post('/:lessonId/youtube', protect, authorize('admin'), setYouTubeVideo);
router.put('/:lessonId/settings', protect, authorize('admin'), updateVideoSettings);

export default router;


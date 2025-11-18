import express from 'express';
import {
  uploadImage,
  uploadVideo,
  uploadDocument,
  uploadCode,
  deleteImage,
  deleteVideo,
  deleteFile,
  getSignedUrl,
} from '../controllers/uploadController';
import { protect } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { uploadImage as multerImage, uploadVideo as multerVideo, uploadDocument as multerDocument, uploadCode as multerCode } from '../middleware/upload';

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(uploadLimiter); // Apply rate limiting to all upload routes

// Image uploads (Cloudinary)
router.post('/image', multerImage.single('image'), uploadImage);
router.delete('/image/:publicId', deleteImage);

// Video uploads (Cloudinary)
router.post('/video', multerVideo.single('video'), uploadVideo);
router.delete('/video/:publicId', deleteVideo);

// Document uploads (S3)
router.post('/document', multerDocument.single('document'), uploadDocument);

// Code file uploads (S3)
router.post('/code', multerCode.single('code'), uploadCode);

// File management (S3)
router.delete('/file/:key', deleteFile);
router.get('/file/:key/signed-url', getSignedUrl);

export default router;


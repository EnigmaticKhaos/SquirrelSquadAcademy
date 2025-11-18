import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { uploadImage as uploadImageToCloudinary, deleteImage as deleteImageFromCloudinary } from '../services/cloudinaryService';
import { uploadVideo as uploadVideoToCloudinary, deleteVideo as deleteVideoFromCloudinary } from '../services/cloudinaryService';
import { uploadFile as uploadFileToS3, deleteFile as deleteFileFromS3, getSignedFileUrl } from '../services/s3Service';
import { validateFile, handleUploadError, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, ALLOWED_DOCUMENT_TYPES, ALLOWED_CODE_TYPES, FILE_SIZE_LIMITS } from '../middleware/upload';
import logger from '../utils/logger';

// @desc    Upload image
// @route   POST /api/upload/image
// @access  Private
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided',
    });
  }

  const validation = validateFile(req.file, ALLOWED_IMAGE_TYPES, FILE_SIZE_LIMITS.IMAGE);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    });
  }

  try {
    const { folder } = req.body;
    const folderPath = folder ? `squirrelsquadacademy/images/${folder}` : 'squirrelsquadacademy/images';

    const result = await uploadImageToCloudinary({
      file: req.file.buffer,
      folder: folderPath,
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
      },
    });
  } catch (error) {
    logger.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
    });
  }
});

// @desc    Upload video
// @route   POST /api/upload/video
// @access  Private
export const uploadVideo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No video file provided',
    });
  }

  const validation = validateFile(req.file, ALLOWED_VIDEO_TYPES, FILE_SIZE_LIMITS.VIDEO);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    });
  }

  try {
    const { folder } = req.body;
    const folderPath = folder ? `squirrelsquadacademy/videos/${folder}` : 'squirrelsquadacademy/videos';

    const result = await uploadVideoToCloudinary({
      file: req.file.buffer,
      folder: folderPath,
    });

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        duration: result.duration,
        size: result.bytes,
      },
    });
  } catch (error) {
    logger.error('Error uploading video:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading video',
    });
  }
});

// @desc    Upload document
// @route   POST /api/upload/document
// @access  Private
export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No document file provided',
    });
  }

  const validation = validateFile(req.file, ALLOWED_DOCUMENT_TYPES, FILE_SIZE_LIMITS.DOCUMENT);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    });
  }

  try {
    const { folder, metadata } = req.body;
    const folderPath = folder ? `squirrelsquadacademy/documents/${folder}` : 'squirrelsquadacademy/documents';

    const parsedMetadata = metadata ? JSON.parse(metadata) : {};

    const result = await uploadFileToS3({
      file: req.file.buffer,
      filename: req.file.originalname,
      folder: folderPath,
      contentType: req.file.mimetype,
      metadata: {
        uploadedBy: req.user._id.toString(),
        ...parsedMetadata,
      },
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        key: result.key,
        url: result.url,
        size: result.size,
        contentType: result.contentType,
      },
    });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
    });
  }
});

// @desc    Upload code file
// @route   POST /api/upload/code
// @access  Private
export const uploadCode = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No code file provided',
    });
  }

  const validation = validateFile(req.file, ALLOWED_CODE_TYPES, FILE_SIZE_LIMITS.CODE);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    });
  }

  try {
    const { folder, metadata } = req.body;
    const folderPath = folder ? `squirrelsquadacademy/code/${folder}` : 'squirrelsquadacademy/code';

    const parsedMetadata = metadata ? JSON.parse(metadata) : {};

    const result = await uploadFileToS3({
      file: req.file.buffer,
      filename: req.file.originalname,
      folder: folderPath,
      contentType: req.file.mimetype,
      metadata: {
        uploadedBy: req.user._id.toString(),
        ...parsedMetadata,
      },
    });

    res.json({
      success: true,
      message: 'Code file uploaded successfully',
      data: {
        key: result.key,
        url: result.url,
        size: result.size,
        contentType: result.contentType,
      },
    });
  } catch (error) {
    logger.error('Error uploading code file:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading code file',
    });
  }
});

// @desc    Delete image
// @route   DELETE /api/upload/image/:publicId
// @access  Private
export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.params;

  try {
    await deleteImageFromCloudinary(publicId);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
    });
  }
});

// @desc    Delete video
// @route   DELETE /api/upload/video/:publicId
// @access  Private
export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.params;

  try {
    await deleteVideoFromCloudinary(publicId);

    res.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting video',
    });
  }
});

// @desc    Delete file from S3
// @route   DELETE /api/upload/file/:key
// @access  Private
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;

  try {
    await deleteFileFromS3(key);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
    });
  }
});

// @desc    Get signed URL for file
// @route   GET /api/upload/file/:key/signed-url
// @access  Private
export const getSignedUrl = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { expiresIn = 3600 } = req.query;

  try {
    const url = await getSignedFileUrl(key, Number(expiresIn));

    res.json({
      success: true,
      url,
      expiresIn: Number(expiresIn),
    });
  } catch (error) {
    logger.error('Error generating signed URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating signed URL',
    });
  }
});


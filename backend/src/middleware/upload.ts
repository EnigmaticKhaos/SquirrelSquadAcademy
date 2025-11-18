import multer from 'multer';
import { Request } from 'express';
import logger from '../utils/logger';

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 500 * 1024 * 1024, // 500MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  CODE: 10 * 1024 * 1024, // 10MB
  GENERAL: 100 * 1024 * 1024, // 100MB
};

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];
export const ALLOWED_CODE_TYPES = [
  'text/javascript',
  'text/typescript',
  'text/x-python',
  'text/x-java',
  'text/x-c',
  'text/x-c++',
  'text/x-csharp',
  'text/html',
  'text/css',
  'application/json',
  'application/xml',
  'text/xml',
];

// File filter function
const createFileFilter = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }

    // Check file size (will be checked again in storage, but this is a first check)
    cb(null, true);
  };
};

// Memory storage for processing files
const storage = multer.memoryStorage();

// Upload middleware configurations
export const uploadImage = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.IMAGE,
  },
  fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, FILE_SIZE_LIMITS.IMAGE),
});

export const uploadVideo = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.VIDEO,
  },
  fileFilter: createFileFilter(ALLOWED_VIDEO_TYPES, FILE_SIZE_LIMITS.VIDEO),
});

export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.DOCUMENT,
  },
  fileFilter: createFileFilter(ALLOWED_DOCUMENT_TYPES, FILE_SIZE_LIMITS.DOCUMENT),
});

export const uploadCode = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.CODE,
  },
  fileFilter: createFileFilter(ALLOWED_CODE_TYPES, FILE_SIZE_LIMITS.CODE),
});

export const uploadGeneral = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.GENERAL,
  },
});

// Helper function to validate file
export const validateFile = (
  file: Express.Multer.File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`,
    };
  }

  return { valid: true };
};

// Error handler for multer errors
export const handleUploadError = (error: any): { success: false; message: string } => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return { success: false, message: 'File too large' };
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return { success: false, message: 'Too many files' };
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return { success: false, message: 'Unexpected file field' };
    }
    return { success: false, message: error.message };
  }
  return { success: false, message: error.message || 'Upload error' };
};


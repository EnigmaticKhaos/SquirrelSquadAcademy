import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env';
import logger from '../utils/logger';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

export interface UploadVideoOptions {
  file: Buffer | string; // Buffer for file upload, string for file path
  folder?: string;
  resourceType?: 'video' | 'image' | 'raw';
  publicId?: string;
  transformation?: any;
}

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
}

/**
 * Upload video to Cloudinary
 */
export const uploadVideo = async (
  options: UploadVideoOptions
): Promise<UploadResult> => {
  try {
    const {
      file,
      folder = 'squirrelsquadacademy/videos',
      resourceType = 'video',
      publicId,
      transformation,
    } = options;

    const uploadOptions: any = {
      resource_type: resourceType,
      folder,
      eager: [
        { format: 'mp4', video_codec: 'h264' },
        { format: 'webm', video_codec: 'vp9' },
      ],
      eager_async: true,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (transformation) {
      uploadOptions.transformation = transformation;
    }

    let result;
    if (Buffer.isBuffer(file)) {
      // Upload from buffer
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              logger.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              resolve({
                public_id: result.public_id,
                secure_url: result.secure_url,
                url: result.url,
                format: result.format,
                width: result.width,
                height: result.height,
                duration: result.duration,
                bytes: result.bytes,
              });
            } else {
              reject(new Error('Upload failed: No result returned'));
            }
          }
        );

        const bufferStream = new Readable();
        bufferStream.push(file);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });
    } else {
      // Upload from file path
      result = await cloudinary.uploader.upload(file, uploadOptions);
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration,
        bytes: result.bytes,
      };
    }
  } catch (error) {
    logger.error('Error uploading video to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete video from Cloudinary
 */
export const deleteVideo = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
    });
    logger.info(`Deleted video from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error('Error deleting video from Cloudinary:', error);
    throw error;
  }
};

/**
 * Generate video thumbnail
 */
export const generateVideoThumbnail = async (
  publicId: string,
  timestamp?: number
): Promise<string> => {
  try {
    const url = cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        {
          width: 1280,
          height: 720,
          crop: 'fill',
          quality: 'auto',
        },
        ...(timestamp ? [{ start_offset: timestamp }] : []),
      ],
    });
    return url;
  } catch (error) {
    logger.error('Error generating video thumbnail:', error);
    throw error;
  }
};

/**
 * Get video information
 */
export const getVideoInfo = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
    });
    return result;
  } catch (error) {
    logger.error('Error getting video info from Cloudinary:', error);
    throw error;
  }
};

/**
 * Generate video URL with transformations
 */
export const getVideoUrl = (
  publicId: string,
  options?: {
    format?: string;
    quality?: string;
    width?: number;
    height?: number;
    crop?: string;
    startOffset?: number;
  }
): string => {
  try {
    const transformation: any[] = [];

    if (options?.width || options?.height) {
      transformation.push({
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
      });
    }

    if (options?.quality) {
      transformation.push({ quality: options.quality });
    }

    if (options?.startOffset) {
      transformation.push({ start_offset: options.startOffset });
    }

    const url = cloudinary.url(publicId, {
      resource_type: 'video',
      format: options?.format || 'mp4',
      transformation,
      secure: true,
    });

    return url;
  } catch (error) {
    logger.error('Error generating video URL:', error);
    throw error;
  }
};

/**
 * Upload image to Cloudinary
 */
export const uploadImage = async (
  options: {
    file: Buffer | string;
    folder?: string;
    publicId?: string;
    transformation?: any;
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  }
): Promise<UploadResult> => {
  try {
    const {
      file,
      folder = 'squirrelsquadacademy/images',
      publicId,
      transformation,
      width,
      height,
      crop,
      quality,
    } = options;

    const uploadOptions: any = {
      resource_type: 'image',
      folder,
      format: 'auto',
      fetch_format: 'auto',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const transformations: any[] = [];
    if (width || height) {
      transformations.push({
        width,
        height,
        crop: crop || 'fill',
      });
    }
    if (quality) {
      transformations.push({ quality });
    }
    if (transformation) {
      transformations.push(transformation);
    }

    if (transformations.length > 0) {
      uploadOptions.transformation = transformations;
    }

    let result;
    if (Buffer.isBuffer(file)) {
      // Upload from buffer
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              logger.error('Cloudinary image upload error:', error);
              reject(error);
            } else if (result) {
              resolve({
                public_id: result.public_id,
                secure_url: result.secure_url,
                url: result.url,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
              });
            } else {
              reject(new Error('Upload failed: No result returned'));
            }
          }
        );

        const bufferStream = new Readable();
        bufferStream.push(file);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });
    } else {
      // Upload from file path
      result = await cloudinary.uploader.upload(file, uploadOptions);
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    }
  } catch (error) {
    logger.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
    logger.info(`Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Generate image URL with transformations
 */
export const getImageUrl = (
  publicId: string,
  options?: {
    format?: string;
    quality?: string;
    width?: number;
    height?: number;
    crop?: string;
  }
): string => {
  try {
    const transformation: any[] = [];

    if (options?.width || options?.height) {
      transformation.push({
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
      });
    }

    if (options?.quality) {
      transformation.push({ quality: options.quality });
    }

    const url = cloudinary.url(publicId, {
      resource_type: 'image',
      format: options?.format || 'auto',
      transformation,
      secure: true,
    });

    return url;
  } catch (error) {
    logger.error('Error generating image URL:', error);
    throw error;
  }
};


import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env';
import logger from '../utils/logger';
import { Readable } from 'stream';

// Initialize S3 client
const s3Client = new S3Client({
  region: config.awsRegion,
  credentials: config.awsAccessKeyId && config.awsSecretAccessKey ? {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
  } : undefined,
});

export interface UploadFileOptions {
  file: Buffer | Readable;
  filename: string;
  folder?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadFileResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  contentType: string;
}

/**
 * Upload file to S3
 */
export const uploadFile = async (
  options: UploadFileOptions
): Promise<UploadFileResult> => {
  try {
    const {
      file,
      filename,
      folder = 'squirrelsquadacademy/files',
      contentType = 'application/octet-stream',
      metadata = {},
    } = options;

    // Generate unique key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const key = `${folder}/${timestamp}-${randomString}-${filename}`;

    // Prepare body
    let body: Buffer | Readable;
    if (Buffer.isBuffer(file)) {
      body = file;
    } else {
      body = file;
    }

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    });

    await s3Client.send(command);

    // Generate URL
    const url = `https://${config.awsS3Bucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;

    logger.info(`File uploaded to S3: ${key}`);

    return {
      key,
      url,
      bucket: config.awsS3Bucket,
      size: Buffer.isBuffer(file) ? file.length : 0, // Size will be 0 for streams
      contentType,
    };
  } catch (error) {
    logger.error('Error uploading file to S3:', error);
    throw error;
  }
};

/**
 * Get file from S3
 */
export const getFile = async (key: string): Promise<Buffer> => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('File not found');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    logger.error('Error getting file from S3:', error);
    throw error;
  }
};

/**
 * Get signed URL for file (temporary access)
 */
export const getSignedFileUrl = async (
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    logger.error('Error generating signed URL:', error);
    throw error;
  }
};

/**
 * Delete file from S3
 */
export const deleteFile = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
    });

    await s3Client.send(command);
    logger.info(`File deleted from S3: ${key}`);
  } catch (error) {
    logger.error('Error deleting file from S3:', error);
    throw error;
  }
};

/**
 * Check if file exists in S3
 */
export const fileExists = async (key: string): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    logger.error('Error checking file existence:', error);
    throw error;
  }
};

/**
 * Get file metadata from S3
 */
export const getFileMetadata = async (key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: config.awsS3Bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
      metadata: response.Metadata,
    };
  } catch (error) {
    logger.error('Error getting file metadata:', error);
    throw error;
  }
};


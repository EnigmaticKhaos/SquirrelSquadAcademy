import PDFDocument from 'pdfkit';
import Certificate from '../models/Certificate';
import CourseCompletion from '../models/CourseCompletion';
import Course from '../models/Course';
import User from '../models/User';
import { uploadFileToS3, downloadFileFromS3 } from './s3Service';
import logger from '../utils/logger';
import crypto from 'crypto';

/**
 * Generate unique certificate ID
 */
const generateCertificateId = (): string => {
  return `CERT-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
};

/**
 * Generate unique verification code
 */
const generateVerificationCode = (): string => {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
};

/**
 * Generate shareable link
 */
const generateShareableLink = (certificateId: string): string => {
  return `/certificates/verify/${certificateId}`;
};

/**
 * Create certificate from course completion
 */
export const createCertificateFromCompletion = async (
  completionId: string
): Promise<Certificate> => {
  try {
    const completion = await CourseCompletion.findById(completionId)
      .populate('user')
      .populate('course');

    if (!completion) {
      throw new Error('Course completion not found');
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      courseCompletion: completionId,
    });

    if (existingCertificate) {
      return existingCertificate;
    }

    const user = completion.user as any;
    const course = completion.course as any;

    // Generate certificate ID and verification code
    const certificateId = generateCertificateId();
    const verificationCode = generateVerificationCode();
    const shareableLink = generateShareableLink(certificateId);

    // Format duration
    const duration = completion.timeToComplete
      ? formatDuration(completion.timeToComplete)
      : undefined;

    // Create certificate
    const certificate = await Certificate.create({
      user: user._id,
      course: course?._id,
      courseCompletion: completionId,
      title: `Certificate of Completion - ${course?.title || 'Course'}`,
      description: `This certifies that ${user.username} has successfully completed ${course?.title || 'the course'}.`,
      issuedDate: completion.completedAt || new Date(),
      certificateId,
      verificationCode,
      shareableLink,
      certificateData: {
        userName: user.username,
        courseName: course?.title,
        completionDate: completion.completedAt || new Date(),
        finalScore: completion.finalScore,
        passed: completion.passed,
        duration,
        issuedBy: 'SquirrelSquad Academy',
      },
    });

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(certificate);
    
    // Upload PDF to S3
    const uploadResult = await uploadFileToS3({
      fileBuffer: pdfBuffer,
      fileName: `certificate-${certificateId}.pdf`,
      folder: 'squirrelsquadacademy/certificates',
      contentType: 'application/pdf',
      isPublic: false,
    });

    // Update certificate with PDF URL
    certificate.pdfUrl = uploadResult.url;
    certificate.pdfKey = uploadResult.key;
    await certificate.save();

    logger.info(`Certificate created: ${certificateId} for user ${user._id}`);
    return certificate;
  } catch (error) {
    logger.error('Error creating certificate:', error);
    throw error;
  }
};

/**
 * Generate certificate PDF
 */
const generateCertificatePDF = async (certificate: Certificate): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        layout: 'landscape',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Background color
      const bgColor = certificate.design?.backgroundColor || '#f8f9fa';
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgColor);

      // Border
      const borderColor = certificate.design?.borderColor || '#2c3e50';
      doc.strokeColor(borderColor);
      doc.lineWidth(10);
      doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke();

      // Inner border
      doc.lineWidth(2);
      doc.rect(50, 50, doc.page.width - 100, doc.page.height - 100).stroke();

      // Title
      doc.fontSize(48)
        .fillColor(certificate.design?.textColor || '#2c3e50')
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF COMPLETION', {
          align: 'center',
          y: 150,
        });

      // Subtitle
      doc.fontSize(20)
        .font('Helvetica')
        .text('This is to certify that', {
          align: 'center',
          y: 250,
        });

      // User name
      doc.fontSize(36)
        .font('Helvetica-Bold')
        .fillColor('#3498db')
        .text(certificate.certificateData.userName, {
          align: 'center',
          y: 300,
        });

      // Course name
      if (certificate.certificateData.courseName) {
        doc.fontSize(24)
          .font('Helvetica')
          .fillColor(certificate.design?.textColor || '#2c3e50')
          .text('has successfully completed', {
            align: 'center',
            y: 370,
          });

        doc.fontSize(28)
          .font('Helvetica-Bold')
          .fillColor('#e74c3c')
          .text(certificate.certificateData.courseName, {
            align: 'center',
            y: 410,
          });
      }

      // Date
      const dateStr = certificate.certificateData.completionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      doc.fontSize(16)
        .font('Helvetica')
        .fillColor(certificate.design?.textColor || '#2c3e50')
        .text(`Issued on ${dateStr}`, {
          align: 'center',
          y: 500,
        });

      // Score (if available)
      if (certificate.certificateData.finalScore !== undefined) {
        doc.fontSize(14)
          .text(`Final Score: ${certificate.certificateData.finalScore}%`, {
            align: 'center',
            y: 530,
          });
      }

      // Verification code
      doc.fontSize(10)
        .fillColor('#95a5a6')
        .text(`Verification Code: ${certificate.verificationCode}`, {
          align: 'center',
          y: doc.page.height - 100,
        });

      // Certificate ID
      doc.text(`Certificate ID: ${certificate.certificateId}`, {
        align: 'center',
        y: doc.page.height - 80,
      });

      // Issued by
      doc.fontSize(12)
        .fillColor(certificate.design?.textColor || '#2c3e50')
        .text(`Issued by ${certificate.certificateData.issuedBy}`, {
          align: 'center',
          y: doc.page.height - 50,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get certificate by ID
 */
export const getCertificate = async (certificateId: string): Promise<Certificate | null> => {
  try {
    return await Certificate.findOne({ certificateId })
      .populate('user', 'username profilePhoto')
      .populate('course', 'title thumbnail');
  } catch (error) {
    logger.error('Error getting certificate:', error);
    return null;
  }
};

/**
 * Verify certificate
 */
export const verifyCertificate = async (
  certificateId: string,
  verificationCode?: string
): Promise<{
  valid: boolean;
  certificate?: Certificate;
  message?: string;
}> => {
  try {
    const certificate = await Certificate.findOne({ certificateId })
      .populate('user', 'username profilePhoto')
      .populate('course', 'title thumbnail');

    if (!certificate) {
      return {
        valid: false,
        message: 'Certificate not found',
      };
    }

    // If verification code provided, verify it
    if (verificationCode && certificate.verificationCode !== verificationCode.toUpperCase()) {
      return {
        valid: false,
        message: 'Invalid verification code',
      };
    }

    return {
      valid: true,
      certificate,
    };
  } catch (error) {
    logger.error('Error verifying certificate:', error);
    return {
      valid: false,
      message: 'Error verifying certificate',
    };
  }
};

/**
 * Get user certificates
 */
export const getUserCertificates = async (
  userId: string,
  options?: {
    courseId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ certificates: Certificate[]; total: number }> => {
  try {
    const query: any = { user: userId };

    if (options?.courseId) {
      query.course = options.courseId;
    }

    const total = await Certificate.countDocuments(query);

    const certificates = await Certificate.find(query)
      .populate('course', 'title thumbnail')
      .sort({ issuedDate: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { certificates, total };
  } catch (error) {
    logger.error('Error getting user certificates:', error);
    return { certificates: [], total: 0 };
  }
};

/**
 * Download certificate PDF
 */
export const downloadCertificatePDF = async (certificateId: string): Promise<Buffer | null> => {
  try {
    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate || !certificate.pdfKey) {
      return null;
    }

    // Get PDF from S3
    if (!certificate.pdfKey) {
      return null;
    }
    return await downloadFileFromS3(certificate.pdfKey);
  } catch (error) {
    logger.error('Error downloading certificate PDF:', error);
    return null;
  }
};

/**
 * Format duration in a human-readable format
 */
const formatDuration = (days: number): string => {
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else if (days < 7) {
    return `${Math.round(days)} ${Math.round(days) === 1 ? 'day' : 'days'}`;
  } else if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  } else if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    const years = Math.round(days / 365);
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
};


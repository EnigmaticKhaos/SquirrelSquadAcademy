import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { IUser } from '../models/User';
import {
  createCertificateFromCompletion,
  getCertificate,
  verifyCertificate,
  getUserCertificates,
  downloadCertificatePDF,
} from '../services/certificateService';

// @desc    Create certificate from course completion
// @route   POST /api/certificates/from-completion/:completionId
// @access  Private
export const createCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { completionId } = req.params;

  const certificate = await createCertificateFromCompletion(completionId);

  res.status(201).json({
    success: true,
    message: 'Certificate created successfully',
    certificate,
  });
});

// @desc    Get user certificates
// @route   GET /api/certificates
// @access  Private
export const getCertificates = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { courseId, limit = 50, offset = 0 } = req.query;

  const { certificates, total } = await getUserCertificates(userId, {
    courseId: courseId as string,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: certificates.length,
    total,
    certificates,
  });
});

// @desc    Get single certificate
// @route   GET /api/certificates/:certificateId
// @access  Private
export const getCertificateById = asyncHandler(async (req: Request, res: Response) => {
  const { certificateId } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId; role?: string };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const certificate = await getCertificate(certificateId);

  if (!certificate) {
    return res.status(404).json({
      success: false,
      message: 'Certificate not found',
    });
  }

  // Check if user owns the certificate
  if (certificate.user.toString() !== userId && userDoc.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this certificate',
    });
  }

  res.json({
    success: true,
    certificate,
  });
});

// @desc    Verify certificate (public)
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
export const verifyCertificatePublic = asyncHandler(async (req: Request, res: Response) => {
  const { certificateId } = req.params;
  const { code } = req.query;

  const verification = await verifyCertificate(certificateId, code as string);

  if (!verification.valid) {
    return res.status(404).json({
      success: false,
      message: verification.message || 'Certificate not found or invalid',
    });
  }

  res.json({
    success: true,
    message: 'Certificate verified',
    certificate: verification.certificate,
  });
});

// @desc    Download certificate PDF
// @route   GET /api/certificates/:certificateId/download
// @access  Private
export const downloadCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { certificateId } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId; role?: string };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const certificate = await getCertificate(certificateId);

  if (!certificate) {
    return res.status(404).json({
      success: false,
      message: 'Certificate not found',
    });
  }

  // Check if user owns the certificate
  if (certificate.user.toString() !== userId && userDoc.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to download this certificate',
    });
  }

  const pdfBuffer = await downloadCertificatePDF(certificateId);

  if (!pdfBuffer) {
    return res.status(500).json({
      success: false,
      message: 'Error generating certificate PDF',
    });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificateId}.pdf"`);
  res.send(pdfBuffer);
});


import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { IUser } from '../models/User';
import {
  exportUserData,
  deleteUserAccount,
  requestAccountDeletion,
  cancelAccountDeletion,
  saveCookieConsent,
  acceptPrivacyPolicy,
  updateDataProcessingConsent,
  updateMarketingConsent,
} from '../services/dataPrivacyService';
import DataExport from '../models/DataExport';
import CookieConsent from '../models/CookieConsent';
import User from '../models/User';

// @desc    Export user data
// @route   POST /api/privacy/export
// @access  Private
export const exportUserDataHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const {
    format,
    includeProfile,
    includeCourses,
    includeSocial,
    includeAnalytics,
    includeMessages,
    includeProjects,
  } = req.body;

  const { dataExport, data } = await exportUserData(userId, {
    format,
    includeProfile,
    includeCourses,
    includeSocial,
    includeAnalytics,
    includeMessages,
    includeProjects,
  });

  res.status(201).json({
    success: true,
    export: dataExport,
    data, // Return data directly for immediate download
    message: 'Data export created successfully',
  });
});

// @desc    Get export status
// @route   GET /api/privacy/export/:id
// @access  Private
export const getExportStatus = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  const dataExport = await DataExport.findOne({
    _id: id,
    user: userId,
  });

  if (!dataExport) {
    return res.status(404).json({
      success: false,
      message: 'Export not found',
    });
  }

  res.json({
    success: true,
    export: dataExport,
  });
});

// @desc    Get user's export history
// @route   GET /api/privacy/exports
// @access  Private
export const getExportHistory = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const exports = await DataExport.find({ user: userId })
    .sort({ requestedAt: -1 })
    .limit(10);

  res.json({
    success: true,
    exports,
  });
});

// @desc    Request account deletion
// @route   POST /api/privacy/account/deletion-request
// @access  Private
export const requestAccountDeletionHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { password, deletionDelayDays } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required to confirm account deletion',
    });
  }

  // Verify password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password',
    });
  }

  await requestAccountDeletion(userId, deletionDelayDays || 30);

  res.json({
    success: true,
    message: 'Account deletion requested. You will receive a confirmation email.',
  });
});

// @desc    Cancel account deletion
// @route   POST /api/privacy/account/cancel-deletion
// @access  Private
export const cancelAccountDeletionHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  await cancelAccountDeletion(userId);

  res.json({
    success: true,
    message: 'Account deletion cancelled',
  });
});

// @desc    Delete account immediately (admin or user with password)
// @route   DELETE /api/privacy/account
// @access  Private
export const deleteAccountHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { password, confirm } = req.body;

  // Require password and confirmation
  if (!password || confirm !== 'DELETE') {
    return res.status(400).json({
      success: false,
      message: 'Password and confirmation (confirm: "DELETE") are required',
    });
  }

  // Verify password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password',
    });
  }

  await deleteUserAccount(userId);

  res.json({
    success: true,
    message: 'Account and all associated data deleted successfully',
  });
});

// @desc    Save cookie consent
// @route   POST /api/privacy/cookie-consent
// @access  Public
export const saveCookieConsentHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as (IUser & { _id: mongoose.Types.ObjectId }) | undefined;
  const userId = userDoc?._id?.toString();
  const sessionId = req.body.sessionId || (req as any).sessionID;
  const { necessary, functional, analytics, marketing } = req.body;

  if (necessary === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Cookie consent preferences are required',
    });
  }

  const consent = await saveCookieConsent(
    userId,
    sessionId,
    {
      necessary: necessary !== false, // Always true
      functional: functional || false,
      analytics: analytics || false,
      marketing: marketing || false,
    },
    req.ip,
    req.get('user-agent')
  );

  res.status(201).json({
    success: true,
    consent,
    message: 'Cookie consent saved',
  });
});

// @desc    Get cookie consent
// @route   GET /api/privacy/cookie-consent
// @access  Public
export const getCookieConsent = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as (IUser & { _id: mongoose.Types.ObjectId }) | undefined;
  const userId = userDoc?._id?.toString();
  const sessionId = req.query.sessionId as string || (req as any).sessionID;

  let consent = null;

  if (userId) {
    const user = await User.findById(userId).select('cookieConsent');
    if (user && user.cookieConsent) {
      consent = user.cookieConsent;
    } else {
      consent = await CookieConsent.findOne({ user: userId })
        .sort({ createdAt: -1 });
    }
  } else if (sessionId) {
    consent = await CookieConsent.findOne({ sessionId })
      .sort({ createdAt: -1 });
  }

  res.json({
    success: true,
    consent,
  });
});

// @desc    Accept privacy policy
// @route   POST /api/privacy/privacy-policy/accept
// @access  Private
export const acceptPrivacyPolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { version } = req.body;

  if (!version) {
    return res.status(400).json({
      success: false,
      message: 'Privacy policy version is required',
    });
  }

  await acceptPrivacyPolicy(userId, version);

  res.json({
    success: true,
    message: 'Privacy policy accepted',
  });
});

// @desc    Update data processing consent
// @route   PUT /api/privacy/data-processing-consent
// @access  Private
export const updateDataProcessingConsentHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { consented } = req.body;

  if (typeof consented !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'consented (boolean) is required',
    });
  }

  await updateDataProcessingConsent(userId, consented);

  res.json({
    success: true,
    message: `Data processing consent ${consented ? 'granted' : 'withdrawn'}`,
  });
});

// @desc    Update marketing consent
// @route   PUT /api/privacy/marketing-consent
// @access  Private
export const updateMarketingConsentHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { consented } = req.body;

  if (typeof consented !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'consented (boolean) is required',
    });
  }

  await updateMarketingConsent(userId, consented);

  res.json({
    success: true,
    message: `Marketing consent ${consented ? 'granted' : 'withdrawn'}`,
  });
});

// @desc    Get privacy settings
// @route   GET /api/privacy/settings
// @access  Private
export const getPrivacySettings = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const user = await User.findById(userId).select(
    'privacyPolicyAccepted privacyPolicyAcceptedAt privacyPolicyVersion ' +
    'cookieConsent dataProcessingConsent dataProcessingConsentAt ' +
    'marketingConsent marketingConsentAt ' +
    'accountDeletionRequested accountDeletionScheduled accountDeletedAt ' +
    'privacySettings'
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    settings: {
      privacyPolicyAccepted: user.privacyPolicyAccepted,
      privacyPolicyAcceptedAt: user.privacyPolicyAcceptedAt,
      privacyPolicyVersion: user.privacyPolicyVersion,
      cookieConsent: user.cookieConsent,
      dataProcessingConsent: user.dataProcessingConsent,
      dataProcessingConsentAt: user.dataProcessingConsentAt,
      marketingConsent: user.marketingConsent,
      marketingConsentAt: user.marketingConsentAt,
      accountDeletionRequested: user.accountDeletionRequested,
      accountDeletionScheduled: user.accountDeletionScheduled,
      accountDeletedAt: user.accountDeletedAt,
      privacySettings: user.privacySettings,
    },
  });
});


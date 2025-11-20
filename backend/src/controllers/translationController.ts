import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { IUser } from '../models/User';
import {
  getSupportedLanguages,
  getDefaultLanguage,
  translateContent,
  createOrUpdateTranslation,
  getTranslation,
  getContentTranslations,
  reviewTranslation,
  initializeDefaultLanguages,
} from '../services/translationService';
import Translation from '../models/Translation';
import SupportedLanguage from '../models/SupportedLanguage';

// @desc    Get supported languages
// @route   GET /api/i18n/languages
// @access  Public
export const getLanguages = asyncHandler(async (req: Request, res: Response) => {
  const languages = await getSupportedLanguages();
  const defaultLang = await getDefaultLanguage();

  res.json({
    success: true,
    languages,
    defaultLanguage: defaultLang,
  });
});

// @desc    Get default language
// @route   GET /api/i18n/default-language
// @access  Public
export const getDefaultLanguageHandler = asyncHandler(async (req: Request, res: Response) => {
  const defaultLang = await getDefaultLanguage();

  res.json({
    success: true,
    language: defaultLang,
  });
});

// @desc    Translate content
// @route   POST /api/i18n/translate
// @access  Private/Admin
export const translateContentHandler = asyncHandler(async (req: Request, res: Response) => {
  const { contentType, contentId, targetLanguage, sourceLanguage, fieldsToTranslate, content } = req.body;

  if (!contentType || !contentId || !targetLanguage || !content) {
    return res.status(400).json({
      success: false,
      message: 'contentType, contentId, targetLanguage, and content are required',
    });
  }

  const { translatedContent, aiModel, aiConfidence } = await translateContent(
    content,
    contentType,
    targetLanguage,
    sourceLanguage || 'en',
    fieldsToTranslate || []
  );

  // Save translation
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const translation = await createOrUpdateTranslation(
    contentType,
    contentId,
    targetLanguage,
    translatedContent,
    {
      translatedBy: userDoc._id.toString(),
      translationMethod: 'ai',
      aiModel,
      aiConfidence,
      status: 'completed',
      isPublished: false, // Require review before publishing
    }
  );

  res.json({
    success: true,
    translation,
    translatedContent,
  });
});

// @desc    Get translation for content
// @route   GET /api/i18n/translations/:contentType/:contentId/:language
// @access  Public
export const getTranslationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { contentType, contentId, language } = req.params;

  const translation = await getTranslation(contentType as any, contentId, language);

  if (!translation) {
    return res.status(404).json({
      success: false,
      message: 'Translation not found',
    });
  }

  res.json({
    success: true,
    translation,
  });
});

// @desc    Get all translations for content
// @route   GET /api/i18n/translations/:contentType/:contentId
// @access  Private
export const getContentTranslationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { contentType, contentId } = req.params;

  const translations = await getContentTranslations(contentType as any, contentId);

  res.json({
    success: true,
    translations,
  });
});

// @desc    Create or update translation manually
// @route   POST /api/i18n/translations
// @access  Private/Admin
export const createTranslationHandler = asyncHandler(async (req: Request, res: Response) => {
  const {
    contentType,
    contentId,
    language,
    translatedFields,
    translationMethod,
    isPublished,
  } = req.body;

  if (!contentType || !contentId || !language || !translatedFields) {
    return res.status(400).json({
      success: false,
      message: 'contentType, contentId, language, and translatedFields are required',
    });
  }

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const translation = await createOrUpdateTranslation(
    contentType,
    contentId,
    language,
    translatedFields,
    {
      translatedBy: userDoc._id.toString(),
      translationMethod: translationMethod || 'manual',
      status: isPublished ? 'published' : 'completed',
      isPublished: isPublished || false,
    }
  );

  res.status(201).json({
    success: true,
    translation,
  });
});

// @desc    Review translation
// @route   POST /api/i18n/translations/:id/review
// @access  Private/Admin
export const reviewTranslationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approve, qualityScore, reviewNotes, publish } = req.body;

  if (typeof approve !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'approve (boolean) is required',
    });
  }

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const translation = await reviewTranslation(id, userDoc._id.toString(), {
    approve,
    qualityScore,
    reviewNotes,
    publish: publish || false,
  });

  res.json({
    success: true,
    translation,
  });
});

// @desc    Publish translation
// @route   POST /api/i18n/translations/:id/publish
// @access  Private/Admin
export const publishTranslation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const translation = await Translation.findById(id);

  if (!translation) {
    return res.status(404).json({
      success: false,
      message: 'Translation not found',
    });
  }

  translation.isPublished = true;
  translation.status = 'published';
  await translation.save();

  res.json({
    success: true,
    translation,
  });
});

// @desc    Get translation statistics
// @route   GET /api/i18n/statistics
// @access  Private/Admin
export const getTranslationStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { language } = req.query;

  const query: any = {};
  if (language) {
    query.language = language.toString().toUpperCase();
  }

  const stats = {
    totalTranslations: await Translation.countDocuments(query),
    publishedTranslations: await Translation.countDocuments({ ...query, isPublished: true }),
    pendingReview: await Translation.countDocuments({ ...query, requiresReview: true, status: { $ne: 'reviewed' } }),
    byContentType: await Translation.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$contentType',
          count: { $sum: 1 },
          published: {
            $sum: { $cond: ['$isPublished', 1, 0] },
          },
        },
      },
    ]),
    byLanguage: await Translation.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          published: {
            $sum: { $cond: ['$isPublished', 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
  };

  res.json({
    success: true,
    statistics: stats,
  });
});

// @desc    Initialize default languages (Admin only)
// @route   POST /api/i18n/initialize-languages
// @access  Private/Admin
export const initializeLanguages = asyncHandler(async (req: Request, res: Response) => {
  await initializeDefaultLanguages();

  res.json({
    success: true,
    message: 'Default languages initialized successfully',
  });
});


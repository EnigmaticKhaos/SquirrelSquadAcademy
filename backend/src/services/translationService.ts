import Translation from '../models/Translation';
import SupportedLanguage from '../models/SupportedLanguage';
import OpenAI from 'openai';
import logger from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get supported languages
 */
export const getSupportedLanguages = async (): Promise<any[]> => {
  try {
    const languages = await SupportedLanguage.find({ isEnabled: true })
      .sort({ isDefault: -1, name: 1 });
    return languages;
  } catch (error) {
    logger.error('Error fetching supported languages:', error);
    throw error;
  }
};

/**
 * Get default language
 */
export const getDefaultLanguage = async (): Promise<string> => {
  try {
    const defaultLang = await SupportedLanguage.findOne({ isDefault: true, isEnabled: true });
    return defaultLang?.code || 'en';
  } catch (error) {
    logger.error('Error fetching default language:', error);
    return 'en';
  }
};

/**
 * Translate content using AI
 */
export const translateContent = async (
  content: any,
  contentType: 'course' | 'lesson' | 'module' | 'assignment' | 'quiz' | 'faq' | 'help_article' | 'announcement' | 'achievement' | 'badge' | 'notification' | 'email',
  targetLanguage: string,
  sourceLanguage: string = 'en',
  fieldsToTranslate: string[] = []
): Promise<any> => {
  try {
    // Get language info
    const targetLang = await SupportedLanguage.findOne({ code: targetLanguage.toUpperCase() });
    if (!targetLang || !targetLang.isEnabled) {
      throw new Error(`Language ${targetLanguage} is not supported`);
    }

    if (targetLang.manualTranslationOnly) {
      throw new Error(`Language ${targetLanguage} requires manual translation`);
    }

    // Build translation prompt
    const fieldsToTranslateText = fieldsToTranslate.length > 0
      ? fieldsToTranslate.join(', ')
      : 'all text fields';

    const prompt = `Translate the following ${contentType} content from ${sourceLanguage} to ${targetLanguage} (${targetLang.nativeName}). 
Translate ${fieldsToTranslateText}. 
Maintain the same structure and formatting. 
For technical terms, use standard translations or keep in English if no standard translation exists.
Return only the translated content in JSON format matching the original structure.

Content to translate:
${JSON.stringify(content, null, 2)}`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using cost-effective model
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate content accurately while maintaining context and technical accuracy.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      response_format: { type: 'json_object' },
    });

    const translatedContent = JSON.parse(response.choices[0].message.content || '{}');

    return {
      translatedContent,
      aiModel: 'gpt-4o-mini',
      aiConfidence: 0.85, // Default confidence, could be improved with validation
    };
  } catch (error) {
    logger.error('Error translating content:', error);
    throw error;
  }
};

/**
 * Create or update translation
 */
export const createOrUpdateTranslation = async (
  contentType: 'course' | 'lesson' | 'module' | 'assignment' | 'quiz' | 'faq' | 'help_article' | 'announcement' | 'achievement' | 'badge' | 'notification' | 'email',
  contentId: string,
  language: string,
  translatedFields: any,
  options: {
    translatedBy?: string;
    translationMethod?: 'manual' | 'ai' | 'hybrid';
    aiModel?: string;
    aiConfidence?: number;
    status?: 'pending' | 'in_progress' | 'completed' | 'reviewed' | 'published';
    isPublished?: boolean;
  } = {}
): Promise<any> => {
  try {
    const translation = await Translation.findOneAndUpdate(
      { contentType, contentId, language },
      {
        contentType,
        contentId,
        language: language.toUpperCase(),
        sourceLanguage: 'en',
        translatedFields,
        translatedBy: options.translatedBy,
        translationMethod: options.translationMethod || 'ai',
        aiModel: options.aiModel,
        aiConfidence: options.aiConfidence,
        status: options.status || 'completed',
        isPublished: options.isPublished || false,
        requiresReview: options.translationMethod === 'ai' || options.translationMethod === 'hybrid',
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Update language statistics
    await updateLanguageStatistics(language);

    return translation;
  } catch (error) {
    logger.error('Error creating/updating translation:', error);
    throw error;
  }
};

/**
 * Get translation for content
 */
export const getTranslation = async (
  contentType: 'course' | 'lesson' | 'module' | 'assignment' | 'quiz' | 'faq' | 'help_article' | 'announcement' | 'achievement' | 'badge' | 'notification' | 'email',
  contentId: string,
  language: string
): Promise<any | null> => {
  try {
    const translation = await Translation.findOne({
      contentType,
      contentId,
      language: language.toUpperCase(),
      isPublished: true,
    });

    return translation;
  } catch (error) {
    logger.error('Error fetching translation:', error);
    return null;
  }
};

/**
 * Get all translations for content
 */
export const getContentTranslations = async (
  contentType: 'course' | 'lesson' | 'module' | 'assignment' | 'quiz' | 'faq' | 'help_article' | 'announcement' | 'achievement' | 'badge' | 'notification' | 'email',
  contentId: string
): Promise<any[]> => {
  try {
    const translations = await Translation.find({
      contentType,
      contentId,
    }).populate('translatedBy', 'username').populate('reviewedBy', 'username');

    return translations;
  } catch (error) {
    logger.error('Error fetching content translations:', error);
    return [];
  }
};

/**
 * Review and publish translation
 */
export const reviewTranslation = async (
  translationId: string,
  reviewerId: string,
  options: {
    approve: boolean;
    qualityScore?: number;
    reviewNotes?: string;
    publish?: boolean;
  }
): Promise<any> => {
  try {
    const translation = await Translation.findById(translationId);

    if (!translation) {
      throw new Error('Translation not found');
    }

    if (options.approve) {
      translation.status = 'reviewed';
      translation.reviewedBy = reviewerId as any;
      translation.reviewedAt = new Date();
      translation.requiresReview = false;

      if (options.qualityScore !== undefined) {
        translation.qualityScore = options.qualityScore;
      }

      if (options.reviewNotes) {
        translation.reviewNotes = options.reviewNotes;
      }

      if (options.publish) {
        translation.isPublished = true;
        translation.status = 'published';
      }
    } else {
      translation.status = 'pending';
      if (options.reviewNotes) {
        translation.reviewNotes = options.reviewNotes;
      }
    }

    await translation.save();

    // Update language statistics
    await updateLanguageStatistics(translation.language);

    return translation;
  } catch (error) {
    logger.error('Error reviewing translation:', error);
    throw error;
  }
};

/**
 * Update language statistics
 */
const updateLanguageStatistics = async (languageCode: string): Promise<void> => {
  try {
    const publishedCount = await Translation.countDocuments({
      language: languageCode.toUpperCase(),
      isPublished: true,
    });

    // Calculate completion percentage (this is a simplified version)
    // In production, you'd want to calculate based on total content that needs translation
    const totalContent = await Translation.countDocuments({
      language: languageCode.toUpperCase(),
    });

    const completionPercentage = totalContent > 0
      ? Math.round((publishedCount / totalContent) * 100)
      : 0;

    await SupportedLanguage.findOneAndUpdate(
      { code: languageCode.toUpperCase() },
      {
        $set: {
          contentCount: publishedCount,
          completionPercentage,
        },
      }
    );
  } catch (error) {
    logger.error('Error updating language statistics:', error);
  }
};

/**
 * Initialize default languages
 */
export const initializeDefaultLanguages = async (): Promise<void> => {
  try {
    const defaultLanguages = [
      { code: 'EN', name: 'English', nativeName: 'English', isDefault: true, flagEmoji: '🇺🇸', rtl: false },
      { code: 'ES', name: 'Spanish', nativeName: 'Español', isDefault: false, flagEmoji: '🇪🇸', rtl: false },
      { code: 'FR', name: 'French', nativeName: 'Français', isDefault: false, flagEmoji: '🇫🇷', rtl: false },
      { code: 'DE', name: 'German', nativeName: 'Deutsch', isDefault: false, flagEmoji: '🇩🇪', rtl: false },
      { code: 'IT', name: 'Italian', nativeName: 'Italiano', isDefault: false, flagEmoji: '🇮🇹', rtl: false },
      { code: 'PT', name: 'Portuguese', nativeName: 'Português', isDefault: false, flagEmoji: '🇵🇹', rtl: false },
      { code: 'ZH', name: 'Chinese', nativeName: '中文', isDefault: false, flagEmoji: '🇨🇳', rtl: false },
      { code: 'JA', name: 'Japanese', nativeName: '日本語', isDefault: false, flagEmoji: '🇯🇵', rtl: false },
      { code: 'KO', name: 'Korean', nativeName: '한국어', isDefault: false, flagEmoji: '🇰🇷', rtl: false },
      { code: 'AR', name: 'Arabic', nativeName: 'العربية', isDefault: false, flagEmoji: '🇸🇦', rtl: true },
      { code: 'RU', name: 'Russian', nativeName: 'Русский', isDefault: false, flagEmoji: '🇷🇺', rtl: false },
      { code: 'HI', name: 'Hindi', nativeName: 'हिन्दी', isDefault: false, flagEmoji: '🇮🇳', rtl: false },
    ];

    for (const lang of defaultLanguages) {
      await SupportedLanguage.findOneAndUpdate(
        { code: lang.code },
        lang,
        { upsert: true, new: true }
      );
    }

    logger.info('Default languages initialized');
  } catch (error) {
    logger.error('Error initializing default languages:', error);
  }
};


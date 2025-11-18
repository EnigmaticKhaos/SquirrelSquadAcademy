import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import User from '../models/User';

// @desc    Get user accessibility preferences
// @route   GET /api/accessibility/preferences
// @access  Private
export const getAccessibilityPreferences = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user._id).select('accessibilityPreferences');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    preferences: user.accessibilityPreferences || {},
  });
});

// @desc    Update user accessibility preferences
// @route   PUT /api/accessibility/preferences
// @access  Private
export const updateAccessibilityPreferences = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Initialize accessibility preferences if they don't exist
  if (!user.accessibilityPreferences) {
    user.accessibilityPreferences = {
      highContrast: false,
      fontSize: 'medium',
      reducedMotion: false,
      screenReaderOptimized: false,
      keyboardNavigation: false,
      focusVisible: true,
      altTextForImages: false,
      captionsEnabled: true,
      audioDescriptions: false,
      colorBlindMode: 'none',
      dyslexiaFont: false,
      readingAssistance: false,
    };
  }

  // Update preferences
  const {
    highContrast,
    fontSize,
    reducedMotion,
    screenReaderOptimized,
    keyboardNavigation,
    focusVisible,
    altTextForImages,
    captionsEnabled,
    captionsLanguage,
    audioDescriptions,
    colorBlindMode,
    dyslexiaFont,
    readingAssistance,
  } = req.body;

  if (highContrast !== undefined) user.accessibilityPreferences.highContrast = highContrast;
  if (fontSize !== undefined) user.accessibilityPreferences.fontSize = fontSize;
  if (reducedMotion !== undefined) user.accessibilityPreferences.reducedMotion = reducedMotion;
  if (screenReaderOptimized !== undefined) user.accessibilityPreferences.screenReaderOptimized = screenReaderOptimized;
  if (keyboardNavigation !== undefined) user.accessibilityPreferences.keyboardNavigation = keyboardNavigation;
  if (focusVisible !== undefined) user.accessibilityPreferences.focusVisible = focusVisible;
  if (altTextForImages !== undefined) user.accessibilityPreferences.altTextForImages = altTextForImages;
  if (captionsEnabled !== undefined) user.accessibilityPreferences.captionsEnabled = captionsEnabled;
  if (captionsLanguage !== undefined) user.accessibilityPreferences.captionsLanguage = captionsLanguage;
  if (audioDescriptions !== undefined) user.accessibilityPreferences.audioDescriptions = audioDescriptions;
  if (colorBlindMode !== undefined) user.accessibilityPreferences.colorBlindMode = colorBlindMode;
  if (dyslexiaFont !== undefined) user.accessibilityPreferences.dyslexiaFont = dyslexiaFont;
  if (readingAssistance !== undefined) user.accessibilityPreferences.readingAssistance = readingAssistance;

  await user.save();

  res.json({
    success: true,
    message: 'Accessibility preferences updated successfully',
    preferences: user.accessibilityPreferences,
  });
});

// @desc    Reset accessibility preferences to defaults
// @route   POST /api/accessibility/preferences/reset
// @access  Private
export const resetAccessibilityPreferences = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user.accessibilityPreferences = {
    highContrast: false,
    fontSize: 'medium',
    reducedMotion: false,
    screenReaderOptimized: false,
    keyboardNavigation: false,
    focusVisible: true,
    altTextForImages: false,
    captionsEnabled: true,
    audioDescriptions: false,
    colorBlindMode: 'none',
    dyslexiaFont: false,
    readingAssistance: false,
  };

  await user.save();

  res.json({
    success: true,
    message: 'Accessibility preferences reset to defaults',
    preferences: user.accessibilityPreferences,
  });
});


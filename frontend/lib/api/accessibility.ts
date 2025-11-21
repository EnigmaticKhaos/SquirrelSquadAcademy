import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

// Types
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface AccessibilityPreferences {
  highContrast?: boolean;
  fontSize?: FontSize;
  reducedMotion?: boolean;
  screenReaderOptimized?: boolean;
  keyboardNavigation?: boolean;
  focusVisible?: boolean;
  altTextForImages?: boolean;
  captionsEnabled?: boolean;
  captionsLanguage?: string;
  audioDescriptions?: boolean;
  colorBlindMode?: ColorBlindMode;
  dyslexiaFont?: boolean;
  readingAssistance?: boolean;
}

export interface UpdateAccessibilityPreferencesData extends Partial<AccessibilityPreferences> {}

// API Client
export const accessibilityApi = {
  // Get user's accessibility preferences
  getPreferences: () =>
    api.get<ApiResponse<{ preferences: AccessibilityPreferences }>>('/accessibility/preferences'),
  
  // Update accessibility preferences
  updatePreferences: (data: UpdateAccessibilityPreferencesData) =>
    api.put<ApiResponse<{ preferences: AccessibilityPreferences; message: string }>>('/accessibility/preferences', data),
  
  // Reset preferences to defaults
  resetPreferences: () =>
    api.post<ApiResponse<{ preferences: AccessibilityPreferences; message: string }>>('/accessibility/preferences/reset'),
};


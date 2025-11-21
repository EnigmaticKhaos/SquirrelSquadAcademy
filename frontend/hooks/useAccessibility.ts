import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  accessibilityApi,
  type AccessibilityPreferences,
  type UpdateAccessibilityPreferencesData,
} from '@/lib/api/accessibility';
import { showToast, getErrorMessage } from '@/lib/toast';
import { useEffect } from 'react';
import type { FontSize } from '@/lib/api/accessibility';

export const useAccessibilityPreferences = () => {
  return useQuery<AccessibilityPreferences>({
    queryKey: ['accessibility-preferences'],
    queryFn: async () => {
      const response = await accessibilityApi.getPreferences();
      const data = response.data.data || response.data;
      return data?.preferences || {};
    },
    placeholderData: {},
  });
};

export const useUpdateAccessibilityPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAccessibilityPreferencesData) => accessibilityApi.updatePreferences(data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['accessibility-preferences'], (old: AccessibilityPreferences = {}) => ({
        ...old,
        ...variables,
      }));
      queryClient.invalidateQueries({ queryKey: ['accessibility-preferences'] });
      
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const message = responseData?.message || 'Accessibility preferences updated';
      showToast.success('Preferences updated', message);
      
      // Apply preferences to the document
      applyAccessibilityPreferences(variables);
    },
    onError: (error) => {
      showToast.error('Failed to update preferences', getErrorMessage(error));
    },
  });
};

export const useResetAccessibilityPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => accessibilityApi.resetPreferences(),
    onSuccess: (data) => {
      const responseData = (data as any)?.data?.data || (data as any)?.data;
      const preferences = responseData?.preferences || getDefaultPreferences();
      
      queryClient.setQueryData(['accessibility-preferences'], preferences);
      queryClient.invalidateQueries({ queryKey: ['accessibility-preferences'] });
      
      showToast.success('Preferences reset', 'Accessibility preferences have been reset to defaults.');
      
      // Apply default preferences
      applyAccessibilityPreferences(preferences);
    },
    onError: (error) => {
      showToast.error('Failed to reset preferences', getErrorMessage(error));
    },
  });
};

// Hook to apply accessibility preferences to the document
export const useApplyAccessibilityPreferences = () => {
  const { data: preferences } = useAccessibilityPreferences();

  useEffect(() => {
    if (preferences) {
      applyAccessibilityPreferences(preferences);
    }
  }, [preferences]);
};

// Apply accessibility preferences to the document
const applyAccessibilityPreferences = (preferences: Partial<AccessibilityPreferences>) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // High contrast
  if (preferences.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
  
  // Font size
  root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
  if (preferences.fontSize) {
    root.classList.add(`font-${preferences.fontSize}`);
  }
  
  // Reduced motion
  if (preferences.reducedMotion) {
    root.classList.add('reduced-motion');
  } else {
    root.classList.remove('reduced-motion');
  }
  
  // Screen reader optimized
  if (preferences.screenReaderOptimized) {
    root.classList.add('screen-reader-optimized');
  } else {
    root.classList.remove('screen-reader-optimized');
  }
  
  // Keyboard navigation
  if (preferences.keyboardNavigation) {
    root.classList.add('keyboard-navigation');
  } else {
    root.classList.remove('keyboard-navigation');
  }
  
  // Focus visible
  if (preferences.focusVisible !== undefined) {
    if (preferences.focusVisible) {
      root.classList.add('focus-visible-enhanced');
    } else {
      root.classList.remove('focus-visible-enhanced');
    }
  }
  
  // Color blind mode
  root.classList.remove('color-blind-protanopia', 'color-blind-deuteranopia', 'color-blind-tritanopia');
  if (preferences.colorBlindMode && preferences.colorBlindMode !== 'none') {
    root.classList.add(`color-blind-${preferences.colorBlindMode}`);
  }
  
  // Dyslexia font
  if (preferences.dyslexiaFont) {
    root.classList.add('dyslexia-font');
  } else {
    root.classList.remove('dyslexia-font');
  }
  
  // Set CSS variables for dynamic styling
  if (preferences.fontSize) {
    const fontSizeMap = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      'extra-large': '1.25rem',
    };
    root.style.setProperty('--accessibility-font-size', fontSizeMap[preferences.fontSize]);
  }
};

const getDefaultPreferences = (): AccessibilityPreferences => ({
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
});


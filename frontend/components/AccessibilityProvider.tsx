'use client';

import React from 'react';
import { useApplyAccessibilityPreferences } from '@/hooks/useAccessibility';

/**
 * Provider component to apply accessibility preferences globally
 * This should be included in the app layout to ensure preferences are applied
 */
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useApplyAccessibilityPreferences();
  return <>{children}</>;
};


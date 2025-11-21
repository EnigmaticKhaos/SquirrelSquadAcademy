'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  useAccessibilityPreferences,
  useUpdateAccessibilityPreferences,
  useResetAccessibilityPreferences,
} from '@/hooks/useAccessibility';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  LoadingSpinner,
  Badge,
} from '@/components/ui';
import { SettingsSidebar, PageHeader, AppLayout } from '@/components/layout';
import { showToast } from '@/lib/toast';
import type { FontSize, ColorBlindMode } from '@/lib/api/accessibility';
import { Eye, Keyboard, Volume2, Palette, Type, RotateCcw, Accessibility } from 'lucide-react';

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' },
];

const COLOR_BLIND_OPTIONS: { value: ColorBlindMode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'protanopia', label: 'Protanopia (Red-blind)' },
  { value: 'deuteranopia', label: 'Deuteranopia (Green-blind)' },
  { value: 'tritanopia', label: 'Tritanopia (Blue-blind)' },
];

export default function AccessibilitySettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: preferences, isLoading: preferencesLoading } = useAccessibilityPreferences();
  const updatePreferences = useUpdateAccessibilityPreferences();
  const resetPreferences = useResetAccessibilityPreferences();
  
  // Preferences are applied globally via AccessibilityProvider in app/providers.tsx

  const [localPreferences, setLocalPreferences] = useState({
    highContrast: false,
    fontSize: 'medium' as FontSize,
    reducedMotion: false,
    screenReaderOptimized: false,
    keyboardNavigation: false,
    focusVisible: true,
    altTextForImages: false,
    captionsEnabled: true,
    captionsLanguage: 'en',
    audioDescriptions: false,
    colorBlindMode: 'none' as ColorBlindMode,
    dyslexiaFont: false,
    readingAssistance: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        highContrast: preferences.highContrast || false,
        fontSize: preferences.fontSize || 'medium',
        reducedMotion: preferences.reducedMotion || false,
        screenReaderOptimized: preferences.screenReaderOptimized || false,
        keyboardNavigation: preferences.keyboardNavigation || false,
        focusVisible: preferences.focusVisible !== undefined ? preferences.focusVisible : true,
        altTextForImages: preferences.altTextForImages || false,
        captionsEnabled: preferences.captionsEnabled !== undefined ? preferences.captionsEnabled : true,
        captionsLanguage: preferences.captionsLanguage || 'en',
        audioDescriptions: preferences.audioDescriptions || false,
        colorBlindMode: preferences.colorBlindMode || 'none',
        dyslexiaFont: preferences.dyslexiaFont || false,
        readingAssistance: preferences.readingAssistance || false,
      });
    }
  }, [preferences]);

  const handleToggle = async (key: keyof typeof localPreferences, value: any) => {
    const newValue = typeof value === 'boolean' ? value : value;
    const newPreferences = { ...localPreferences, [key]: newValue };
    setLocalPreferences(newPreferences);
    
    try {
      await updatePreferences.mutateAsync({ [key]: newValue });
    } catch (error) {
      // Revert on error
      setLocalPreferences(localPreferences);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all accessibility preferences to defaults?')) {
      return;
    }

    try {
      await resetPreferences.mutateAsync();
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (authLoading || preferencesLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
          <SettingsSidebar
            items={[
              { label: 'Profile', href: '/settings/profile', icon: null },
              { label: 'Account', href: '/settings/account', icon: null },
              { label: 'Security', href: '/settings/security', icon: null },
              { label: 'Notifications', href: '/settings/notifications', icon: null },
              { label: 'Privacy', href: '/settings/privacy', icon: null },
              { label: 'Accessibility', href: '/settings/accessibility', icon: null },
            ]}
          />
          
          <div className="lg:col-span-3">
            <PageHeader
              title="Accessibility Settings"
              description="Customize your experience to make the platform more accessible for you."
            />

            <div className="space-y-6">
              {/* Visual Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Visual Preferences
                  </CardTitle>
                  <CardDescription>
                    Adjust visual settings to improve readability and visibility
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        High Contrast Mode
                      </label>
                      <p className="text-sm text-gray-400">
                        Increase contrast for better visibility
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPreferences.highContrast}
                      onChange={(e) => handleToggle('highContrast', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Font Size
                      </label>
                      <p className="text-sm text-gray-400">
                        Adjust the base font size across the platform
                      </p>
                    </div>
                    <select
                      value={localPreferences.fontSize}
                      onChange={(e) => handleToggle('fontSize', e.target.value as FontSize)}
                      className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      {FONT_SIZE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Color Blind Mode
                      </label>
                      <p className="text-sm text-gray-400">
                        Adjust colors for color vision deficiencies
                      </p>
                    </div>
                    <select
                      value={localPreferences.colorBlindMode}
                      onChange={(e) => handleToggle('colorBlindMode', e.target.value as ColorBlindMode)}
                      className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      {COLOR_BLIND_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Dyslexia-Friendly Font
                      </label>
                      <p className="text-sm text-gray-400">
                        Use a font designed for readers with dyslexia
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPreferences.dyslexiaFont}
                      onChange={(e) => handleToggle('dyslexiaFont', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Reduced Motion
                      </label>
                      <p className="text-sm text-gray-400">
                        Minimize animations and transitions
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPreferences.reducedMotion}
                      onChange={(e) => handleToggle('reducedMotion', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Navigation & Interaction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="h-5 w-5" />
                    Navigation & Interaction
                  </CardTitle>
                  <CardDescription>
                    Enhance keyboard navigation and focus indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Enhanced Keyboard Navigation
                      </label>
                      <p className="text-sm text-gray-400">
                        Improve keyboard navigation throughout the platform
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPreferences.keyboardNavigation}
                      onChange={(e) => handleToggle('keyboardNavigation', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Enhanced Focus Indicators
                      </label>
                      <p className="text-sm text-gray-400">
                        Make focus indicators more visible
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPreferences.focusVisible}
                      onChange={(e) => handleToggle('focusVisible', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Screen Reader & Assistive Technology */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility className="h-5 w-5" />
                    Screen Reader & Assistive Technology
                  </CardTitle>
                  <CardDescription>
                    Optimize the platform for screen readers and assistive technologies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Screen Reader Optimized
                      </label>
                      <p className="text-sm text-gray-400">
                        Optimize content structure for screen readers
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPreferences.screenReaderOptimized}
                      onChange={(e) => handleToggle('screenReaderOptimized', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Always Show Alt Text
                      </label>
                      <p className="text-sm text-gray-400">
                        Display alternative text for images
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPreferences.altTextForImages}
                      onChange={(e) => handleToggle('altTextForImages', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Reading Assistance
                      </label>
                      <p className="text-sm text-gray-400">
                        Enable reading assistance features
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPreferences.readingAssistance}
                      onChange={(e) => handleToggle('readingAssistance', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Audio & Video */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Audio & Video
                  </CardTitle>
                  <CardDescription>
                    Configure audio and video accessibility options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Enable Captions by Default
                      </label>
                      <p className="text-sm text-gray-400">
                        Automatically show captions for videos
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPreferences.captionsEnabled}
                      onChange={(e) => handleToggle('captionsEnabled', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </div>

                  {localPreferences.captionsEnabled && (
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-100">
                          Caption Language
                        </label>
                        <p className="text-sm text-gray-400">
                          Preferred language for captions
                        </p>
                      </div>
                      <input
                        type="text"
                        value={localPreferences.captionsLanguage}
                        onChange={(e) => handleToggle('captionsLanguage', e.target.value)}
                        placeholder="en"
                        className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-100">
                        Audio Descriptions
                      </label>
                      <p className="text-sm text-gray-400">
                        Enable audio descriptions when available
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPreferences.audioDescriptions}
                      onChange={(e) => handleToggle('audioDescriptions', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Reset */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Reset Preferences
                  </CardTitle>
                  <CardDescription>
                    Reset all accessibility preferences to their default values
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleReset}
                    disabled={resetPreferences.isPending}
                    variant="outline"
                  >
                    {resetPreferences.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset to Defaults
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


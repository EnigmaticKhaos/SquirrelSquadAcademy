'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCookieConsent, useSaveCookieConsent } from '@/hooks/useDataPrivacy';
import { Button, Checkbox } from '@/components/ui';
import { Cookie, X } from 'lucide-react';

export function CookieConsentBanner() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Generate or retrieve session ID
      let sid = localStorage.getItem('sessionId');
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('sessionId', sid);
      }
      setSessionId(sid);
    }
  }, []);

  const { data: consent, isLoading } = useCookieConsent(sessionId, !!sessionId);
  const saveConsent = useSaveCookieConsent();

  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Show banner if no consent exists
    if (!isLoading && !consent && sessionId) {
      setShowBanner(true);
    } else if (consent) {
      setShowBanner(false);
      // Set preferences from existing consent
      setPreferences({
        necessary: consent.necessary,
        functional: consent.functional,
        analytics: consent.analytics,
        marketing: consent.marketing,
      });
    }
  }, [consent, isLoading, sessionId]);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    handleSaveConsent(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    handleSaveConsent(necessaryOnly);
  };

  const handleSaveConsent = (consentPrefs: typeof preferences) => {
    if (!sessionId) return;
    
    saveConsent.mutate(
      {
        ...consentPrefs,
        sessionId,
      },
      {
        onSuccess: () => {
          setShowBanner(false);
        },
      }
    );
  };

  const handleSaveCustom = () => {
    handleSaveConsent(preferences);
  };

  if (!showBanner || isLoading || !sessionId) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-700 bg-gray-800 p-4 shadow-lg">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <Cookie className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-100 mb-1">Cookie Consent</h3>
                <p className="text-sm text-gray-400">
                  We use cookies to enhance your experience, analyze site usage, and assist in marketing efforts.
                  You can customize your preferences below.
                </p>
                <div className="mt-3 space-y-2">
                  <Checkbox
                    label="Necessary cookies (required)"
                    checked={preferences.necessary}
                    disabled
                  />
                  <Checkbox
                    label="Functional cookies"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  />
                  <Checkbox
                    label="Analytics cookies"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  />
                  <Checkbox
                    label="Marketing cookies"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
            <Button
              onClick={() => setShowBanner(false)}
              variant="outline"
              size="sm"
              className="sm:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleAcceptNecessary}
              variant="outline"
              size="sm"
              disabled={saveConsent.isPending}
            >
              Necessary Only
            </Button>
            <Button
              onClick={handleSaveCustom}
              variant="outline"
              size="sm"
              disabled={saveConsent.isPending}
            >
              Save Preferences
            </Button>
            <Button
              onClick={handleAcceptAll}
              size="sm"
              disabled={saveConsent.isPending}
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

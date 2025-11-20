'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, Checkbox, Button } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    email: true,
    inApp: true,
    courseUpdates: true,
    socialActivity: true,
    achievements: true,
  });

  const handleSave = async () => {
    // Save notification preferences
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Settings', href: '/settings' },
              { label: 'Notifications' },
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-gray-100">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                <div>
                  <h3 className="mb-4 font-semibold text-gray-100">Delivery Methods</h3>
                  <div className="space-y-3">
                    <Checkbox
                      label="Email notifications"
                      checked={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.checked })}
                    />
                    <Checkbox
                      label="In-app notifications"
                      checked={settings.inApp}
                      onChange={(e) => setSettings({ ...settings, inApp: e.target.checked })}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 font-semibold text-gray-100">What to notify me about</h3>
                  <div className="space-y-3">
                    <Checkbox
                      label="Course updates and announcements"
                      checked={settings.courseUpdates}
                      onChange={(e) => setSettings({ ...settings, courseUpdates: e.target.checked })}
                    />
                    <Checkbox
                      label="Social activity (likes, comments, mentions)"
                      checked={settings.socialActivity}
                      onChange={(e) => setSettings({ ...settings, socialActivity: e.target.checked })}
                    />
                    <Checkbox
                      label="Achievements and badges"
                      checked={settings.achievements}
                      onChange={(e) => setSettings({ ...settings, achievements: e.target.checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Save Preferences</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


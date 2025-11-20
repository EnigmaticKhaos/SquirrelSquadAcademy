'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, Checkbox, Button, LoadingSpinner } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateUserSettings } from '@/hooks/useUserSettings';

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const updateSettings = useUpdateUserSettings();
  const [settings, setSettings] = useState<{
    email: boolean;
    inApp: boolean;
    [key: string]: boolean | undefined;
  }>({
    email: true,
    inApp: true,
  });

  useEffect(() => {
    if (user?.notificationPreferences) {
      setSettings({
        email: user.notificationPreferences.email ?? true,
        inApp: user.notificationPreferences.inApp ?? true,
        notify_course_enrollment: user.notificationPreferences.notify_course_enrollment ?? true,
        notify_course_completion: user.notificationPreferences.notify_course_completion ?? true,
        notify_assignment_graded: user.notificationPreferences.notify_assignment_graded ?? true,
        notify_achievement_unlocked: user.notificationPreferences.notify_achievement_unlocked ?? true,
        notify_badge_earned: user.notificationPreferences.notify_badge_earned ?? true,
        notify_post_liked: user.notificationPreferences.notify_post_liked ?? true,
        notify_comment_reply: user.notificationPreferences.notify_comment_reply ?? true,
        notify_mention: user.notificationPreferences.notify_mention ?? true,
        notify_message_received: user.notificationPreferences.notify_message_received ?? true,
        notify_friend_request: user.notificationPreferences.notify_friend_request ?? true,
        notify_challenge_started: user.notificationPreferences.notify_challenge_started ?? true,
        notify_challenge_completed: user.notificationPreferences.notify_challenge_completed ?? true,
        notify_learning_path_milestone: user.notificationPreferences.notify_learning_path_milestone ?? true,
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        notificationPreferences: settings,
      });
      alert('Notification preferences saved successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save preferences');
    }
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
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-300">Learning</h4>
                      <div className="space-y-2 pl-4">
                        <Checkbox
                          label="Course enrollments"
                          checked={settings.notify_course_enrollment ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_course_enrollment: e.target.checked })}
                        />
                        <Checkbox
                          label="Course completions"
                          checked={settings.notify_course_completion ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_course_completion: e.target.checked })}
                        />
                        <Checkbox
                          label="Assignment grades"
                          checked={settings.notify_assignment_graded ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_assignment_graded: e.target.checked })}
                        />
                        <Checkbox
                          label="Learning path milestones"
                          checked={settings.notify_learning_path_milestone ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_learning_path_milestone: e.target.checked })}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-300">Gamification</h4>
                      <div className="space-y-2 pl-4">
                        <Checkbox
                          label="Achievements unlocked"
                          checked={settings.notify_achievement_unlocked ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_achievement_unlocked: e.target.checked })}
                        />
                        <Checkbox
                          label="Badges earned"
                          checked={settings.notify_badge_earned ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_badge_earned: e.target.checked })}
                        />
                        <Checkbox
                          label="Challenge started"
                          checked={settings.notify_challenge_started ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_challenge_started: e.target.checked })}
                        />
                        <Checkbox
                          label="Challenge completed"
                          checked={settings.notify_challenge_completed ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_challenge_completed: e.target.checked })}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-300">Social</h4>
                      <div className="space-y-2 pl-4">
                        <Checkbox
                          label="Post likes"
                          checked={settings.notify_post_liked ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_post_liked: e.target.checked })}
                        />
                        <Checkbox
                          label="Comment replies"
                          checked={settings.notify_comment_reply ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_comment_reply: e.target.checked })}
                        />
                        <Checkbox
                          label="Mentions"
                          checked={settings.notify_mention ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_mention: e.target.checked })}
                        />
                        <Checkbox
                          label="Messages received"
                          checked={settings.notify_message_received ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_message_received: e.target.checked })}
                        />
                        <Checkbox
                          label="Friend requests"
                          checked={settings.notify_friend_request ?? true}
                          onChange={(e) => setSettings({ ...settings, notify_friend_request: e.target.checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    isLoading={updateSettings.isPending}
                    disabled={updateSettings.isPending}
                  >
                    Save Preferences
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, Input, Textarea, Button, Avatar } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Update profile logic
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Settings', href: '/settings' },
              { label: 'Profile' },
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-gray-100">Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar src={user?.profilePhoto} name={user?.username} size="xl" />
                  <div>
                    <Button variant="outline" type="button">
                      Change Photo
                    </Button>
                    <p className="mt-2 text-sm text-gray-400">JPG, PNG or GIF. Max size 2MB</p>
                  </div>
                </div>

                <Input
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <Textarea
                  label="Bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />

                <div className="flex justify-end gap-3">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


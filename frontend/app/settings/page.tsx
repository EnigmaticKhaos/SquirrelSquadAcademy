'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, PageHeader } from '@/components/layout';
import { Card, CardContent, LoadingSpinner } from '@/components/ui';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const settingsItems = [
    { label: 'Profile', href: '/settings/profile', icon: '👤' },
    { label: 'Account', href: '/settings/account', icon: '⚙️' },
    { label: 'Security', href: '/settings/security', icon: '🔒' },
    { label: 'Notifications', href: '/settings/notifications', icon: '🔔' },
    { label: 'Privacy', href: '/settings/privacy', icon: '🛡️' },
    { label: 'Accessibility', href: '/settings/accessibility', icon: '♿' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader title="Settings" description="Manage your account settings and preferences" />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
            <Sidebar items={settingsItems.map(item => ({ label: item.label, href: item.href }))} />
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-300">Select a setting category from the sidebar</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


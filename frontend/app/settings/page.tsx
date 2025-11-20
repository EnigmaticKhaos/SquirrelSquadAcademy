'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SettingsSidebar, PageHeader, AppLayout } from '@/components/layout';
import { Card, CardContent, LoadingSpinner } from '@/components/ui';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const settingsItems = [
    { label: 'Profile', href: '/settings/profile', icon: null },
    { label: 'Account', href: '/settings/account', icon: null },
    { label: 'Security', href: '/settings/security', icon: null },
    { label: 'Notifications', href: '/settings/notifications', icon: null },
    { label: 'Privacy', href: '/settings/privacy', icon: null },
    { label: 'Accessibility', href: '/settings/accessibility', icon: null },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title="Settings" description="Manage your account settings and preferences" />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
          <SettingsSidebar items={settingsItems} />
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-300">Select a setting category from the sidebar</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


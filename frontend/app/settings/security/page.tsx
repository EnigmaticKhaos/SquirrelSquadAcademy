'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, Button, Checkbox } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';
import Link from 'next/link';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Settings', href: '/settings' },
              { label: 'Security' },
            ]}
          />

          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-100">Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-100">2FA Status</p>
                      <p className="text-sm text-gray-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Link href="/settings/security/2fa/setup">
                      <Button variant={twoFactorEnabled ? 'outline' : 'primary'}>
                        {twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-100">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">
                  Manage your active sessions and devices
                </p>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">No active sessions to display</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


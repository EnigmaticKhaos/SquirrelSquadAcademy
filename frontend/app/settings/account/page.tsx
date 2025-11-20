'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, Input, Button, Modal } from '@/components/ui';
import { Breadcrumbs } from '@/components/layout';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Change password logic
  };

  const handleDeleteAccount = async () => {
    // Delete account logic
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Settings', href: '/settings' },
              { label: 'Account' },
            ]}
          />

          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-100">Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <div className="flex justify-end">
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-100">Delete Account</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Account"
            footer={
              <>
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </>
            }
          >
            <p className="text-gray-300">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
          </Modal>
        </div>
      </main>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  usePrivacySettings,
  useExportUserData,
  useExportHistory,
  useRequestAccountDeletion,
  useCancelAccountDeletion,
  useDeleteAccount,
  useAcceptPrivacyPolicy,
  useUpdateDataProcessingConsent,
  useUpdateMarketingConsent,
} from '@/hooks/useDataPrivacy';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  LoadingSpinner,
  Checkbox,
  Input,
  Badge,
  Modal,
  EmptyState,
} from '@/components/ui';
import { SettingsSidebar, PageHeader, AppLayout, Breadcrumbs } from '@/components/layout';
import { showToast, getErrorMessage } from '@/lib/toast';
import type { ExportFormat } from '@/lib/api/dataPrivacy';
import { Download, Trash2, Shield, FileText, Cookie, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: privacySettings, isLoading: settingsLoading, refetch } = usePrivacySettings();
  const exportData = useExportUserData();
  const { data: exportHistory } = useExportHistory();
  const requestDeletion = useRequestAccountDeletion();
  const cancelDeletion = useCancelAccountDeletion();
  const deleteAccount = useDeleteAccount();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletionRequestModal, setShowDeletionRequestModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletionRequestPassword, setDeletionRequestPassword] = useState('');
  const [deletionDelayDays, setDeletionDelayDays] = useState(30);

  const [exportOptions, setExportOptions] = useState({
    format: 'json' as ExportFormat,
    includeProfile: true,
    includeCourses: true,
    includeSocial: true,
    includeAnalytics: true,
    includeMessages: true,
    includeProjects: true,
  });

  const acceptPrivacyPolicy = useAcceptPrivacyPolicy();
  const updateDataProcessingConsent = useUpdateDataProcessingConsent();
  const updateMarketingConsent = useUpdateMarketingConsent();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleExportData = async () => {
    try {
      await exportData.mutateAsync(exportOptions);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRequestDeletion = async () => {
    if (!deletionRequestPassword) {
      showToast.error('Password is required');
      return;
    }

    try {
      await requestDeletion.mutateAsync({
        password: deletionRequestPassword,
        deletionDelayDays,
      });
      setShowDeletionRequestModal(false);
      setDeletionRequestPassword('');
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancelDeletion = async () => {
    try {
      await cancelDeletion.mutateAsync();
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast.error('Password is required');
      return;
    }
    if (deleteConfirm !== 'DELETE') {
      showToast.error('Please type DELETE to confirm');
      return;
    }

    try {
      await deleteAccount.mutateAsync({
        password: deletePassword,
        confirm: deleteConfirm,
      });
      setShowDeleteModal(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAcceptPrivacyPolicy = async () => {
    try {
      await acceptPrivacyPolicy.mutateAsync();
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (authLoading || settingsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
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

  const hasDeletionRequested = privacySettings?.accountDeletionRequested;
  const deletionScheduledAt = privacySettings?.accountDeletionScheduled;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Privacy' },
          ]}
        />
        <PageHeader
          title="Privacy Settings"
          description="Manage your data privacy, export your data, and control your account"
        />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
          <SettingsSidebar items={settingsItems} />
          <div className="lg:col-span-3 space-y-6">
            {/* Privacy Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <FileText className="h-5 w-5" />
                  Privacy Policy
                </CardTitle>
                <CardDescription>
                  Review and accept our privacy policy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {privacySettings?.privacyPolicyAccepted ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>Privacy policy accepted</span>
                    {privacySettings.privacyPolicyAcceptedAt && (
                      <span className="text-sm text-gray-400">
                        on {new Date(privacySettings.privacyPolicyAcceptedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      Please read and accept our privacy policy to continue using the platform.
                    </p>
                    <Button
                      onClick={handleAcceptPrivacyPolicy}
                      disabled={acceptPrivacyPolicy.isPending}
                    >
                      {acceptPrivacyPolicy.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Accepting...
                        </>
                      ) : (
                        'Accept Privacy Policy'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Processing Consents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Shield className="h-5 w-5" />
                  Data Processing Consents
                </CardTitle>
                <CardDescription>
                  Control how your data is processed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-100">Data Processing Consent</p>
                    <p className="text-sm text-gray-400">
                      Allow us to process your data to provide our services
                    </p>
                  </div>
                  <Checkbox
                    label=""
                    checked={privacySettings?.dataProcessingConsent ?? false}
                    onChange={(e) => updateDataProcessingConsent.mutate(e.target.checked)}
                    disabled={updateDataProcessingConsent.isPending}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-100">Marketing Consent</p>
                    <p className="text-sm text-gray-400">
                      Receive marketing emails and promotional content
                    </p>
                  </div>
                  <Checkbox
                    label=""
                    checked={privacySettings?.marketingConsent ?? false}
                    onChange={(e) => updateMarketingConsent.mutate(e.target.checked)}
                    disabled={updateMarketingConsent.isPending}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-100">
                  <Download className="h-5 w-5" />
                  Data Export
                </CardTitle>
                <CardDescription>
                  Download a copy of your data in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Export Format
                  </label>
                  <select
                    value={exportOptions.format}
                    onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as ExportFormat })}
                    className="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Include in Export
                  </label>
                  <div className="space-y-2">
                    <Checkbox
                      label="Profile Information"
                      checked={exportOptions.includeProfile}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeProfile: e.target.checked })}
                    />
                    <Checkbox
                      label="Courses & Learning Progress"
                      checked={exportOptions.includeCourses}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeCourses: e.target.checked })}
                    />
                    <Checkbox
                      label="Social Activity (Posts, Comments)"
                      checked={exportOptions.includeSocial}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeSocial: e.target.checked })}
                    />
                    <Checkbox
                      label="Analytics & Statistics"
                      checked={exportOptions.includeAnalytics}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeAnalytics: e.target.checked })}
                    />
                    <Checkbox
                      label="Messages & Conversations"
                      checked={exportOptions.includeMessages}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeMessages: e.target.checked })}
                    />
                    <Checkbox
                      label="Projects & Submissions"
                      checked={exportOptions.includeProjects}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeProjects: e.target.checked })}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleExportData}
                  disabled={exportData.isPending}
                  className="w-full"
                >
                  {exportData.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export My Data
                    </>
                  )}
                </Button>

                {exportHistory && exportHistory.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Export History</h3>
                    <div className="space-y-2">
                      {exportHistory.slice(0, 5).map((exportItem) => (
                        <div
                          key={exportItem._id}
                          className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              className={
                                exportItem.status === 'completed'
                                  ? 'bg-green-500/10 text-green-400'
                                  : exportItem.status === 'failed'
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-yellow-500/10 text-yellow-400'
                              }
                            >
                              {exportItem.status}
                            </Badge>
                            <span className="text-sm text-gray-300">
                              {exportItem.format.toUpperCase()} - {new Date(exportItem.requestedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {exportItem.status === 'completed' && exportItem.fileUrl && (
                            <a
                              href={exportItem.fileUrl}
                              download
                              className="text-sm text-blue-400 hover:text-blue-300"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Deletion */}
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Account Deletion
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasDeletionRequested ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                      <div className="flex items-center gap-2 text-yellow-400 mb-2">
                        <Clock className="h-5 w-5" />
                        <span className="font-semibold">Account Deletion Scheduled</span>
                      </div>
                      {deletionScheduledAt && (
                        <p className="text-sm text-gray-300">
                          Your account will be deleted on {new Date(deletionScheduledAt).toLocaleString()}
                        </p>
                      )}
                      <p className="text-sm text-gray-400 mt-2">
                        You can cancel this request anytime before the scheduled deletion date.
                      </p>
                    </div>
                    <Button
                      onClick={handleCancelDeletion}
                      disabled={cancelDeletion.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {cancelDeletion.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Deletion Request'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                      <p className="text-sm text-gray-300">
                        <strong className="text-red-400">Warning:</strong> This action cannot be undone. All your data,
                        including courses, progress, projects, and messages will be permanently deleted.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowDeletionRequestModal(true)}
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        Request Deletion (30 days)
                      </Button>
                      <Button
                        onClick={() => setShowDeleteModal(true)}
                        variant="danger"
                        className="flex-1"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Immediately
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Deletion Request Modal */}
        <Modal
          isOpen={showDeletionRequestModal}
          onClose={() => setShowDeletionRequestModal(false)}
          title="Request Account Deletion"
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
              <p className="text-sm text-gray-300">
                Your account will be scheduled for deletion in {deletionDelayDays} days. You will receive a confirmation
                email and can cancel this request anytime before the deletion date.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Deletion Delay (days)
              </label>
              <Input
                type="number"
                value={deletionDelayDays}
                onChange={(e) => setDeletionDelayDays(parseInt(e.target.value) || 30)}
                min="1"
                max="90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                value={deletionRequestPassword}
                onChange={(e) => setDeletionRequestPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeletionRequestModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestDeletion}
                disabled={requestDeletion.isPending || !deletionRequestPassword}
                variant="danger"
                className="flex-1"
              >
                {requestDeletion.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Requesting...
                  </>
                ) : (
                  'Request Deletion'
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Immediate Deletion Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account Immediately"
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-red-400 font-semibold mb-2">This action is irreversible!</p>
              <p className="text-sm text-gray-300">
                All your data will be permanently deleted immediately. This includes:
              </p>
              <ul className="text-sm text-gray-400 mt-2 list-disc list-inside space-y-1">
                <li>Your profile and account information</li>
                <li>All course progress and certificates</li>
                <li>Projects, submissions, and assignments</li>
                <li>Messages, posts, and social activity</li>
                <li>All other associated data</li>
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type <strong className="text-red-400">DELETE</strong> to confirm
              </label>
              <Input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteConfirm('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteAccount.isPending || !deletePassword || deleteConfirm !== 'DELETE'}
                variant="danger"
                className="flex-1"
              >
                {deleteAccount.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}


'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useNotifications, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import { Card, CardContent, LoadingSpinner, ErrorMessage, Button, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export default function NotificationsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useNotifications({ limit: 50 });
  const markAllAsRead = useMarkAllNotificationsAsRead();

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Notifications"
            actions={
              <div className="flex gap-2">
                {data && data.data && data.data.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                  >
                    Mark all as read
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push('/settings/notifications')}
                >
                  Preferences
                </Button>
              </div>
            }
          />

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <ErrorMessage message="Failed to load notifications" onRetry={() => router.refresh()} />
          )}

          {data && data.data && data.data.length === 0 && (
            <EmptyState
              title="No notifications"
              description="You're all caught up! Check back later for new notifications."
            />
          )}

          {data && data.data && data.data.length > 0 && (
            <div className="space-y-2">
              {data.data.map((notification) => (
                <Card
                  key={notification._id}
                  className={!notification.isRead ? 'border-blue-500 bg-blue-900/20' : ''}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-100">{notification.title}</h3>
                        <p className="text-sm text-gray-300">{notification.message}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUnreadNotificationCount, useMarkNotificationAsRead } from '@/hooks/useNotifications';
import { Badge, Card, CardContent, LoadingSpinner } from '@/components/ui';

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationAsRead();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notificationId: string, actionUrl?: string) => {
    markAsRead.mutate(notificationId);
    setIsOpen(false);
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <Badge
            variant="danger"
            size="sm"
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <Card>
            <CardContent className="max-h-96 overflow-y-auto p-0">
              <div className="border-b p-4">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="p-2">
                <p className="p-4 text-center text-sm text-gray-500">
                  No notifications
                </p>
              </div>
              <div className="border-t p-2">
                <button
                  onClick={() => {
                    router.push('/notifications');
                    setIsOpen(false);
                  }}
                  className="w-full rounded-md px-3 py-2 text-sm text-blue-600 hover:bg-gray-50"
                >
                  View all notifications
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};


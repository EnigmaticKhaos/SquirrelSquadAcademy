'use client';

import React, { useState, useEffect } from 'react';
import { useAnnouncements, useMarkAnnouncementAsRead } from '@/hooks/useAnnouncements';
import { Button, Badge } from '@/components/ui';
import { X, AlertCircle, Info, Megaphone, Wrench, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Announcement, AnnouncementType, AnnouncementPriority } from '@/lib/api/announcements';

interface AnnouncementBannerProps {
  className?: string;
  maxAnnouncements?: number;
  showUnreadOnly?: boolean;
}

const getAnnouncementIcon = (type: AnnouncementType) => {
  switch (type) {
    case 'maintenance':
      return <Wrench className="w-5 h-5" />;
    case 'feature':
      return <Sparkles className="w-5 h-5" />;
    case 'course':
      return <Megaphone className="w-5 h-5" />;
    default:
      return <Info className="w-5 h-5" />;
  }
};

const getPriorityColor = (priority: AnnouncementPriority) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-600 border-red-500';
    case 'high':
      return 'bg-orange-600 border-orange-500';
    case 'normal':
      return 'bg-blue-600 border-blue-500';
    case 'low':
      return 'bg-gray-600 border-gray-500';
    default:
      return 'bg-blue-600 border-blue-500';
  }
};

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  className,
  maxAnnouncements = 3,
  showUnreadOnly = true,
}) => {
  const { data: announcementsData, isLoading } = useAnnouncements({
    includeRead: !showUnreadOnly,
    limit: maxAnnouncements,
  });
  const markAsRead = useMarkAnnouncementAsRead();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (announcementsData?.announcements) {
      const unread = announcementsData.announcements.filter(
        (announcement) => !announcement.isRead && !dismissedIds.has(announcement._id)
      );
      setVisibleAnnouncements(unread.slice(0, maxAnnouncements));
    }
  }, [announcementsData, dismissedIds, maxAnnouncements]);

  const handleDismiss = async (announcement: Announcement) => {
    setDismissedIds((prev) => new Set(prev).add(announcement._id));
    if (!announcement.isRead) {
      await markAsRead.mutateAsync(announcement._id);
    }
  };

  const handleMarkRead = async (announcement: Announcement) => {
    if (!announcement.isRead) {
      await markAsRead.mutateAsync(announcement._id);
    }
  };

  if (isLoading || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement._id}
          className={cn(
            'relative rounded-lg border p-4 shadow-lg',
            getPriorityColor(announcement.priority),
            'text-white'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getAnnouncementIcon(announcement.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm sm:text-base">{announcement.title}</h3>
                  {announcement.priority === 'urgent' && (
                    <Badge variant="danger" className="text-xs">
                      Urgent
                    </Badge>
                  )}
                  {announcement.type && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {announcement.type}
                    </Badge>
                  )}
                </div>
                
                <button
                  onClick={() => handleDismiss(announcement)}
                  className="flex-shrink-0 text-white/80 hover:text-white transition-colors p-1"
                  aria-label="Dismiss announcement"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-sm text-white/90 mb-2 line-clamp-2">
                {announcement.content}
              </p>
              
              <div className="flex items-center gap-2 flex-wrap">
                {announcement.actionUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open(announcement.actionUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Learn More
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                )}
                
                {!announcement.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkRead(announcement)}
                    className="text-xs text-white/80 hover:text-white hover:bg-white/10"
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


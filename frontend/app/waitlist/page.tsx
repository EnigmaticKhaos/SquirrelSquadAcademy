'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useUserWaitlist, useLeaveWaitlist } from '@/hooks/useWaitlist';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  Badge,
} from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { Clock, Users, X, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

export default function WaitlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('waiting');
  const { data, isLoading, error } = useUserWaitlist({ status: statusFilter });
  const leaveWaitlistMutation = useLeaveWaitlist();

  const waitlist = data?.waitlist || [];

  const handleLeaveWaitlist = async (courseId: string) => {
    try {
      await leaveWaitlistMutation.mutateAsync(courseId);
    } catch (error: any) {
      // Error is handled by the hook
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'info' | 'success' | 'warning' | 'default'; label: string }> = {
      waiting: { variant: 'info', label: 'Waiting' },
      notified: { variant: 'warning', label: 'Notified' },
      enrolled: { variant: 'success', label: 'Enrolled' },
      removed: { variant: 'default', label: 'Removed' },
      expired: { variant: 'default', label: 'Expired' },
    };
    const config = variants[status] || variants.waiting;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="My Waitlist"
            description="Manage your course waitlist entries and get notified when spots become available"
          />

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setStatusFilter('waiting')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'waiting'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Waiting
            </button>
            <button
              onClick={() => setStatusFilter('notified')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'notified'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Notified
            </button>
            <button
              onClick={() => setStatusFilter('')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All
            </button>
          </div>

          {isLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <ErrorMessage message="Failed to load waitlist entries. Please try again later." />
          )}

          {!isLoading && !error && waitlist.length === 0 && (
            <EmptyState
              title="No waitlist entries"
              description={
                statusFilter
                  ? `You don't have any ${statusFilter} waitlist entries.`
                  : "You're not on any course waitlists yet."
              }
              icon={<Clock className="h-12 w-12 text-gray-500" />}
            />
          )}

          {!isLoading && !error && waitlist.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {waitlist.map((entry) => {
                const course = typeof entry.course === 'object' ? entry.course : null;
                const courseId = typeof entry.course === 'string' ? entry.course : entry.course?._id;
                const canLeave = entry.status === 'waiting' || entry.status === 'notified';

                return (
                  <Card key={entry._id} hover className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {course ? (
                            <Link href={`/courses/${courseId}`}>
                              <CardTitle className="mb-2 text-lg hover:text-blue-400">
                                {course.title}
                              </CardTitle>
                            </Link>
                          ) : (
                            <CardTitle className="mb-2 text-lg">Course</CardTitle>
                          )}
                          {getStatusBadge(entry.status)}
                        </div>
                        {canLeave && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLeaveWaitlist(courseId || '')}
                            isLoading={leaveWaitlistMutation.isPending}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {entry.status === 'waiting' && entry.position && (
                        <div className="flex items-center gap-2 rounded-lg bg-blue-900/20 border border-blue-700 p-3">
                          <Users className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-blue-300">Position #{entry.position}</p>
                            <p className="text-xs text-blue-400">You'll be notified when a spot opens</p>
                          </div>
                        </div>
                      )}

                      {entry.status === 'notified' && (
                        <div className="rounded-lg bg-yellow-900/20 border border-yellow-700 p-3">
                          <p className="text-sm font-medium text-yellow-300">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Spot Available!
                          </p>
                          <p className="text-xs text-yellow-400 mt-1">
                            Enroll now before your spot expires
                          </p>
                        </div>
                      )}

                      <div className="text-sm text-gray-400 space-y-1">
                        <p>Joined: {new Date(entry.joinedAt).toLocaleDateString()}</p>
                        {entry.notifiedAt && (
                          <p>Notified: {new Date(entry.notifiedAt).toLocaleDateString()}</p>
                        )}
                        {entry.expiresAt && (
                          <p className="text-yellow-400">
                            Expires: {new Date(entry.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {courseId && (
                        <Link href={`/courses/${courseId}`}>
                          <Button variant="outline" className="w-full" size="sm">
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Course
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


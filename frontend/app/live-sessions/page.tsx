'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { PageHeader } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useLiveSessions } from '@/hooks/useLiveSessions';
import type { LiveSessionStatus } from '@/types';

type ViewFilter = 'upcoming' | 'past';

const statusVariant: Record<LiveSessionStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  scheduled: 'info',
  live: 'success',
  ended: 'warning',
  cancelled: 'danger',
};

const formatDate = (value?: string) => {
  if (!value) return 'TBD';
  return new Date(value).toLocaleString();
};

export default function LiveSessionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [view, setView] = useState<ViewFilter>('upcoming');
  const [sessionType, setSessionType] = useState<string>('all');

  const { data: sessions = [], isLoading, error } = useLiveSessions(
    {
      upcoming: view === 'upcoming',
      past: view === 'past',
      type: sessionType !== 'all' ? sessionType : undefined,
    },
    { enabled: !!user }
  );

  const filteredSessions = useMemo(() => sessions ?? [], [sessions]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md border-gray-800 bg-gray-850 text-gray-200">
            <CardContent className="space-y-4 p-6 text-center">
              <p className="text-sm text-gray-400">Please sign in to browse upcoming live sessions.</p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Live Sessions"
            description="Join real-time workshops, Q&As, and study parties with the SquirrelSquad community."
            actions={
              <Button variant="primary" onClick={() => router.push('/projects/create')}>
                Host a Session
              </Button>
            }
          />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex rounded-md border border-gray-700 bg-gray-800 p-1">
              {(['upcoming', 'past'] as ViewFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    view === option ? 'bg-gray-700 text-gray-50' : 'text-gray-400 hover:text-gray-100'
                  }`}
                >
                  {option === 'upcoming' ? 'Upcoming' : 'Past'}
                </button>
              ))}
            </div>
            <select
              value={sessionType}
              onChange={(event) => setSessionType(event.target.value)}
              className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="webinar">Webinar</option>
              <option value="workshop">Workshop</option>
              <option value="qna">Q&A</option>
              <option value="office_hours">Office Hours</option>
              <option value="course_completion_party">Completion Party</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {isLoading && (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <ErrorMessage message="Failed to load live sessions." onRetry={() => router.refresh()} className="mt-6" />
          )}

          {!isLoading && !error && filteredSessions.length === 0 && (
            <EmptyState
              title="No sessions to show"
              description={
                view === 'upcoming'
                  ? 'No upcoming sessions yet—check back soon or host your own!'
                  : 'No past sessions found.'
              }
              className="mt-12 bg-gray-800/40 text-gray-300"
            />
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredSessions.map((session) => (
              <Card key={session._id} className="border-gray-800 bg-gray-850 text-gray-100">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-gray-100">{session.title}</CardTitle>
                    <Badge variant={statusVariant[session.status]} className="capitalize">
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">{session.description || 'No description provided.'}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span>
                      <strong className="text-gray-200">Starts:</strong> {formatDate(session.scheduledStartTime)}
                    </span>
                    {session.scheduledEndTime && (
                      <span>
                        <strong className="text-gray-200">Ends:</strong> {formatDate(session.scheduledEndTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                    <Badge variant="secondary" className="capitalize">
                      {session.sessionType.replace(/_/g, ' ')}
                    </Badge>
                    {session.course && typeof session.course === 'object' && (
                      <span>Linked to {session.course.title}</span>
                    )}
                    <span className="ml-auto text-xs">
                      {session.totalParticipants} participants · Peak {session.peakParticipants}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => router.push(`/live-sessions/${session._id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

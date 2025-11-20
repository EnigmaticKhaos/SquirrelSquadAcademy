'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { PageHeader } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  LoadingSpinner,
  Select,
} from '@/components/ui';
import { useLiveSessions } from '@/hooks/useLiveSessions';
import type { LiveSession, LiveSessionStatus, LiveSessionType } from '@/types';

const STATUS_OPTIONS: Array<{ value: 'all' | LiveSessionStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'live', label: 'Live' },
  { value: 'ended', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TYPE_OPTIONS: Array<{ value: 'all' | LiveSessionType; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'qna', label: 'Q&A' },
  { value: 'office_hours', label: 'Office Hours' },
  { value: 'course_completion_party', label: 'Completion Party' },
  { value: 'custom', label: 'Custom' },
];

const TIME_WINDOWS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live Now' },
  { value: 'past', label: 'Past Sessions' },
  { value: 'all', label: 'All Sessions' },
];

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const formatDuration = (minutes?: number) => {
  if (!minutes) return '—';
  if (minutes >= 60) {
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hr`;
  }
  return `${minutes} min`;
};

const LiveSessionsPage = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | LiveSessionStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | LiveSessionType>('all');
  const [timeWindow, setTimeWindow] = useState<'upcoming' | 'live' | 'past' | 'all'>('upcoming');

  const filters = useMemo(() => {
    return {
      status: statusFilter === 'all' ? undefined : statusFilter,
      sessionType: typeFilter === 'all' ? undefined : typeFilter,
      upcoming: timeWindow === 'upcoming' ? true : undefined,
      past: timeWindow === 'past' ? true : undefined,
      statusOverride: timeWindow === 'live' ? 'live' : undefined,
    };
  }, [statusFilter, typeFilter, timeWindow]);

  const liveSessionFilters = useMemo(() => {
    return {
      status: filters.status ?? (filters.statusOverride as LiveSessionStatus | undefined),
      sessionType: filters.sessionType,
      upcoming: filters.upcoming,
      past: filters.past,
    };
  }, [filters]);

  const { data: sessions, isLoading } = useLiveSessions(liveSessionFilters);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    if (timeWindow !== 'live') return sessions;
    return sessions.filter((session) => session.status === 'live');
  }, [sessions, timeWindow]);

  const renderSessionCard = (session: LiveSession) => {
    const host =
      typeof session.host === 'string'
        ? undefined
        : session.host;
    return (
      <Card key={session._id} className="border-gray-700 bg-gray-800">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-gray-100 text-xl">{session.title}</CardTitle>
              <p className="text-sm text-gray-400">
                Hosted by {host?.username || 'Instructor'} · {session.sessionType.replace(/_/g, ' ')}
              </p>
            </div>
            <Badge
              className="capitalize"
              variant={
                session.status === 'live'
                  ? 'success'
                  : session.status === 'scheduled'
                  ? 'info'
                  : session.status === 'ended'
                  ? 'secondary'
                  : 'danger'
              }
            >
              {session.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {session.description && (
            <p className="text-sm text-gray-300 line-clamp-2">{session.description}</p>
          )}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
            <div>
              <p className="uppercase tracking-wide text-gray-500">Start</p>
              <p className="text-gray-100">{formatDateTime(session.scheduledStartTime)}</p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-gray-500">Duration</p>
              <p className="text-gray-100">{formatDuration(session.duration)}</p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-gray-500">Participants</p>
              <p className="text-gray-100">
                {session.totalParticipants || 0}
                {session.maxParticipants ? ` / ${session.maxParticipants}` : ''}
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-gray-500">Interaction</p>
              <p className="text-gray-100">
                {session.allowQuestions ? 'Q&A' : 'No Q&A'} · {session.allowPolls ? 'Polls' : 'No Polls'}
              </p>
            </div>
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <Link href={`/live-sessions/${session._id}`}>
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
            {session.status === 'live' && session.meetingUrl && (
              <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="primary" className="w-full">
                  Join Live
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Live Sessions"
            description="Join upcoming workshops, live classes, and Q&A sessions in real time."
            actions={
              <Link href="/live-sessions/host">
                <Button>Host a Session</Button>
              </Link>
            }
          />

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | LiveSessionStatus)}
              options={STATUS_OPTIONS}
            />
            <Select
              label="Session Type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'all' | LiveSessionType)}
              options={TYPE_OPTIONS}
            />
            <Select
              label="Timeframe"
              value={timeWindow}
              onChange={(event) =>
                setTimeWindow(event.target.value as 'upcoming' | 'live' | 'past' | 'all')
              }
              options={TIME_WINDOWS}
            />
          </section>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              title="No sessions found"
              description="Try adjusting your filters or check back later for new live sessions."
              action={{
                label: 'Host a Session',
                onClick: () => (window.location.href = '/live-sessions/host'),
              }}
            />
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredSessions.map(renderSessionCard)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LiveSessionsPage;


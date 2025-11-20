'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { PageHeader, Breadcrumbs } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Textarea,
  Input,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  useMentorshipDetail,
  useAddMentorshipSession,
  useCompleteMentorship,
} from '@/hooks/useMentorship';

export default function MentorshipDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const mentorshipId = params?.id;

  const { data: mentorship, isLoading } = useMentorshipDetail(mentorshipId, { enabled: !!user && !!mentorshipId });
  const addSessionMutation = useAddMentorshipSession();
  const completeMentorshipMutation = useCompleteMentorship();

  const [sessionDate, setSessionDate] = useState('');
  const [sessionDuration, setSessionDuration] = useState('45');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionNextSteps, setSessionNextSteps] = useState('');
  const [sessionGoalsDiscussed, setSessionGoalsDiscussed] = useState('');
  const [sessionError, setSessionError] = useState<string | null>(null);

  const isParticipant =
    mentorship &&
    user &&
    (typeof mentorship.mentor === 'string'
      ? mentorship.mentor === user._id
      : mentorship.mentor._id === user._id ||
        (typeof mentorship.mentee === 'string' ? mentorship.mentee === user._id : mentorship.mentee._id === user._id));

  const counterpart = useMemo(() => {
    if (!mentorship || !user) return null;
    const isCurrentMentor =
      typeof mentorship.mentor === 'string' ? mentorship.mentor === user._id : mentorship.mentor._id === user._id;
    return isCurrentMentor
      ? typeof mentorship.mentee === 'string'
        ? null
        : mentorship.mentee
      : typeof mentorship.mentor === 'string'
        ? null
        : mentorship.mentor;
  }, [mentorship, user]);

  const handleAddSession = async () => {
    if (!mentorshipId) return;
    if (!sessionDate) {
      setSessionError('Please provide a session date/time.');
      return;
    }
    try {
      setSessionError(null);
      await addSessionMutation.mutateAsync({
        mentorshipId,
        payload: {
          date: new Date(sessionDate).toISOString(),
          duration: sessionDuration ? Number(sessionDuration) : undefined,
          notes: sessionNotes || undefined,
          goalsDiscussed: sessionGoalsDiscussed
            .split(',')
            .map((goal) => goal.trim())
            .filter(Boolean),
          nextSteps: sessionNextSteps
            .split(',')
            .map((step) => step.trim())
            .filter(Boolean),
        },
      });
      setSessionDate('');
      setSessionDuration('45');
      setSessionNotes('');
      setSessionNextSteps('');
      setSessionGoalsDiscussed('');
    } catch {
      setSessionError('Unable to log session. Please try again.');
    }
  };

  const handleCompleteMentorship = async () => {
    if (!mentorshipId) return;
    await completeMentorshipMutation.mutateAsync({ mentorshipId, payload: {} });
  };

  if (!user) {
    router.replace('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

  if (!mentorship || !isParticipant) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <EmptyState
            title="Mentorship not found"
            description="Either the mentorship doesn’t exist or you don’t have permission to view it."
            className="bg-gray-850 text-gray-300"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Mentorship', href: '/mentorship' },
              { label: counterpart?.username || 'Mentorship detail' },
            ]}
          />
          <PageHeader
            title={counterpart?.username || 'Mentorship detail'}
            description={`Status: ${mentorship.status}`}
            actions={
              mentorship.status !== 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={completeMentorshipMutation.isPending}
                  onClick={handleCompleteMentorship}
                >
                  Mark complete
                </Button>
              )
            }
          />

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-gray-800 bg-gray-850 text-gray-100">
              <CardHeader>
                <CardTitle>Mentorship overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-300">
                <p>
                  Started on{' '}
                  <span className="text-gray-100">
                    {new Date(mentorship.startDate).toLocaleDateString()}
                  </span>
                </p>
                <p>
                  Preferred communication:{' '}
                  <span className="capitalize text-gray-100">
                    {mentorship.preferredCommunicationMethod}
                  </span>
                </p>
                <p>Meeting frequency: {mentorship.meetingFrequency || 'Not set'}</p>
                <p>Goals:</p>
                <ul className="list-disc space-y-1 pl-5 text-gray-200">
                  {mentorship.goals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-850 text-gray-100">
              <CardHeader>
                <CardTitle>Log a session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <label className="text-gray-300">Session date</label>
                  <Input
                    type="datetime-local"
                    value={sessionDate}
                    onChange={(event) => setSessionDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-300">Duration (minutes)</label>
                  <Input
                    type="number"
                    min="15"
                    value={sessionDuration}
                    onChange={(event) => setSessionDuration(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-300">Notes</label>
                  <Textarea
                    value={sessionNotes}
                    onChange={(event) => setSessionNotes(event.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-300">Goals discussed (comma separated)</label>
                  <Input
                    value={sessionGoalsDiscussed}
                    onChange={(event) => setSessionGoalsDiscussed(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-300">Next steps (comma separated)</label>
                  <Input
                    value={sessionNextSteps}
                    onChange={(event) => setSessionNextSteps(event.target.value)}
                  />
                </div>
                {sessionError && <p className="text-sm text-red-400">{sessionError}</p>}
                <Button
                  variant="primary"
                  className="w-full"
                  isLoading={addSessionMutation.isPending}
                  onClick={handleAddSession}
                >
                  Save session
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-gray-800 bg-gray-850 text-gray-100">
              <CardHeader>
                <CardTitle>Session history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mentorship.sessions.length === 0 ? (
                  <EmptyState
                    title="No sessions logged yet"
                    description="As you meet, log notes here to keep both sides aligned."
                    className="bg-gray-900/50 text-gray-400"
                  />
                ) : (
                  mentorship.sessions
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((session) => (
                      <div
                        key={session._id}
                        className="rounded-xl border border-gray-800 bg-gray-900/40 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">Session</p>
                            <p className="text-lg font-semibold text-gray-100">
                              {new Date(session.date).toLocaleDateString()}
                            </p>
                          </div>
                          {session.duration && (
                            <Badge variant="secondary">{session.duration} min</Badge>
                          )}
                        </div>
                        {session.notes && <p className="mt-2 text-sm text-gray-300">{session.notes}</p>}
                        {session.goalsDiscussed && session.goalsDiscussed.length > 0 && (
                          <p className="mt-2 text-xs text-gray-400">
                            Discussed: {session.goalsDiscussed.join(', ')}
                          </p>
                        )}
                        {session.nextSteps && session.nextSteps.length > 0 && (
                          <p className="text-xs text-gray-400">Next steps: {session.nextSteps.join(', ')}</p>
                        )}
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-850 text-gray-100">
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mentorship.milestones.length === 0 ? (
                  <EmptyState
                    title="No milestones"
                    description="Break down your goals into checkpoints to celebrate progress."
                    className="bg-gray-900/50 text-gray-400"
                  />
                ) : (
                  mentorship.milestones.map((milestone) => (
                    <div
                      key={milestone._id}
                      className="rounded-xl border border-gray-800 bg-gray-900/40 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold text-gray-100">{milestone.title}</p>
                          {milestone.description && (
                            <p className="text-sm text-gray-400">{milestone.description}</p>
                          )}
                        </div>
                        <Badge variant={milestone.completed ? 'success' : 'secondary'}>
                          {milestone.completed ? 'Completed' : 'In progress'}
                        </Badge>
                      </div>
                      {milestone.targetDate && (
                        <p className="mt-2 text-xs text-gray-400">
                          Target: {new Date(milestone.targetDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { PageHeader } from '@/components/layout';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Select,
  LoadingSpinner,
  Badge,
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useCreateLiveSession, useLiveSessions } from '@/hooks/useLiveSessions';
import type { LiveSession, LiveSessionType } from '@/types';

const SESSION_TYPE_OPTIONS: Array<{ value: LiveSessionType; label: string }> = [
  { value: 'webinar', label: 'Webinar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'qna', label: 'Q&A' },
  { value: 'office_hours', label: 'Office Hours' },
  { value: 'course_completion_party', label: 'Completion Party' },
  { value: 'custom', label: 'Custom' },
];

const defaultFormState = {
  title: '',
  description: '',
  sessionType: 'webinar' as LiveSessionType,
  scheduledStartTime: '',
  scheduledEndTime: '',
  meetingUrl: '',
  maxParticipants: '',
  isPublic: 'true',
  allowQuestions: 'true',
  allowPolls: 'true',
  requireRegistration: 'false',
};

const HostLiveSessionsPage = () => {
  const { user } = useAuth();
  const [formState, setFormState] = useState(defaultFormState);

  const { data: sessions, isLoading } = useLiveSessions();
  const createSessionMutation = useCreateLiveSession();

  const mySessions = useMemo(() => {
    if (!user?._id || !sessions) return [];
    return sessions.filter((session) => {
      if (typeof session.host === 'string') {
        return session.host === user._id;
      }
      return session.host?._id === user._id;
    });
  }, [sessions, user?._id]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      sessionType: formState.sessionType,
      scheduledStartTime: new Date(formState.scheduledStartTime).toISOString(),
      scheduledEndTime: formState.scheduledEndTime
        ? new Date(formState.scheduledEndTime).toISOString()
        : undefined,
      meetingUrl: formState.meetingUrl || undefined,
      maxParticipants: formState.maxParticipants ? Number(formState.maxParticipants) : undefined,
      isPublic: formState.isPublic === 'true',
      allowQuestions: formState.allowQuestions === 'true',
      allowPolls: formState.allowPolls === 'true',
      requireRegistration: formState.requireRegistration === 'true',
    };

    await createSessionMutation.mutateAsync(payload);
    setFormState(defaultFormState);
  };

  const renderSessionCard = (session: LiveSession) => {
    return (
      <Card key={session._id} className="border-gray-700 bg-gray-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-gray-100 text-lg">{session.title}</CardTitle>
            <Badge
              variant={
                session.status === 'live'
                  ? 'success'
                  : session.status === 'scheduled'
                  ? 'info'
                  : session.status === 'ended'
                  ? 'secondary'
                  : 'danger'
              }
              className="capitalize"
            >
              {session.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-300">
          <p>{session.description || 'No description provided.'}</p>
          <p>
            <span className="text-gray-400">Starts:</span> {new Date(session.scheduledStartTime).toLocaleString()}
          </p>
          <p>
            <span className="text-gray-400">Max participants:</span>{' '}
            {session.maxParticipants || 'Unlimited'}
          </p>
          <div className="flex gap-2 pt-2">
            <Link href={`/live-sessions/${session._id}`} className="w-full">
              <Button variant="outline" className="w-full">
                Manage
              </Button>
            </Link>
            {session.status === 'live' && session.meetingUrl && (
              <a
                href={session.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full">Join now</Button>
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
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Host Live Sessions"
            description="Create new live learning experiences and keep track of your upcoming streams."
            actions={
              <Link href="/live-sessions">
                <Button variant="outline">Browse sessions</Button>
              </Link>
            }
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">Create a new session</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <Input
                    label="Title"
                    name="title"
                    value={formState.title}
                    onChange={handleInputChange}
                    required
                  />
                  <Textarea
                    label="Description"
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                  <Select
                    label="Session type"
                    name="sessionType"
                    value={formState.sessionType}
                    onChange={handleInputChange}
                    options={SESSION_TYPE_OPTIONS}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Start time"
                      type="datetime-local"
                      name="scheduledStartTime"
                      value={formState.scheduledStartTime}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="End time"
                      type="datetime-local"
                      name="scheduledEndTime"
                      value={formState.scheduledEndTime}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Input
                    label="Meeting URL"
                    name="meetingUrl"
                    value={formState.meetingUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                  <Input
                    label="Max participants"
                    name="maxParticipants"
                    type="number"
                    value={formState.maxParticipants}
                    onChange={handleInputChange}
                    min={1}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Select
                      label="Registration required"
                      name="requireRegistration"
                      value={formState.requireRegistration}
                      onChange={handleInputChange}
                      options={[
                        { value: 'false', label: 'No' },
                        { value: 'true', label: 'Yes' },
                      ]}
                    />
                    <Select
                      label="Visibility"
                      name="isPublic"
                      value={formState.isPublic}
                      onChange={handleInputChange}
                      options={[
                        { value: 'true', label: 'Public' },
                        { value: 'false', label: 'Invite only' },
                      ]}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Select
                      label="Allow Q&A"
                      name="allowQuestions"
                      value={formState.allowQuestions}
                      onChange={handleInputChange}
                      options={[
                        { value: 'true', label: 'Enabled' },
                        { value: 'false', label: 'Disabled' },
                      ]}
                    />
                    <Select
                      label="Allow polls"
                      name="allowPolls"
                      value={formState.allowPolls}
                      onChange={handleInputChange}
                      options={[
                        { value: 'true', label: 'Enabled' },
                        { value: 'false', label: 'Disabled' },
                      ]}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createSessionMutation.isPending}
                    className="w-full"
                  >
                    {createSessionMutation.isPending ? 'Creating...' : 'Create session'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-100">Your sessions</h2>
                <Badge variant="secondary">{mySessions.length}</Badge>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : mySessions.length === 0 ? (
                <Card className="border-gray-700 bg-gray-800">
                  <CardContent className="py-8 text-center text-gray-400">
                    You haven&apos;t scheduled any live sessions yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {mySessions.map((session) => renderSessionCard(session))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HostLiveSessionsPage;


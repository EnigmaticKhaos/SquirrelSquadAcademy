'use client';

import { useState } from 'react';
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
  ErrorMessage,
  Input,
  LoadingSpinner,
  Select,
  Textarea,
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  useMentorApplication,
  useSubmitMentorApplication,
  useUpdateMentorAvailability,
} from '@/hooks/useMentorApplication';
import { useMentorshipRequests } from '@/hooks/useMentorship';
import type { MentorApplicationStatus, MentorshipRequest } from '@/types';

const COMMUNICATION_OPTIONS = [
  { value: 'message', label: 'Messages' },
  { value: 'video', label: 'Video Calls' },
  { value: 'both', label: 'Messages + Video' },
];

const STATUS_COLORS: Record<MentorApplicationStatus, 'warning' | 'success' | 'secondary' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'secondary',
};

const parseList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function MentorSettingsPage() {
  const { user } = useAuth();
  const { data: application, isLoading: applicationLoading } = useMentorApplication();
  const { data: pendingRequestsData, isLoading: pendingRequestsLoading } = useMentorshipRequests({
    type: 'incoming',
    status: 'pending',
    limit: 5,
  });

  const submitApplication = useSubmitMentorApplication();
  const updateAvailability = useUpdateMentorAvailability();
  const isMentor = Boolean(user?.mentorStatus?.isMentor);

  const [actionError, setActionError] = useState<string | null>(null);
  const [availabilityToggleLoading, setAvailabilityToggleLoading] = useState(false);
  const [formState, setFormState] = useState({
    motivation: '',
    specialties: '',
    experience: '',
    hoursPerWeek: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    preferredTimes: '',
    maxMentees: '5',
  });

  const pendingRequests = pendingRequestsData?.requests || [];

  const handleAvailabilityToggle = async () => {
    if (!user?.mentorStatus) return;
    setActionError(null);
    setAvailabilityToggleLoading(true);
    try {
      await updateAvailability.mutateAsync(!user.mentorStatus.isAvailable);
    } catch (error: any) {
      setActionError(error?.response?.data?.message || 'Unable to update availability right now.');
    } finally {
      setAvailabilityToggleLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!formState.motivation.trim() || !formState.specialties.trim()) {
      setActionError('Motivation and at least one specialty are required.');
      return;
    }
    setActionError(null);
    try {
      await submitApplication.mutateAsync({
        motivation: formState.motivation.trim(),
        specialties: parseList(formState.specialties),
        experience: formState.experience.trim() || undefined,
        availability: {
          hoursPerWeek: formState.hoursPerWeek ? Number(formState.hoursPerWeek) : undefined,
          timezone: formState.timezone || undefined,
          preferredTimes: parseList(formState.preferredTimes),
        },
        maxMentees: formState.maxMentees ? Number(formState.maxMentees) : undefined,
      });
      setFormState({
        motivation: '',
        specialties: '',
        experience: '',
        hoursPerWeek: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        preferredTimes: '',
        maxMentees: '5',
      });
    } catch (error: any) {
      setActionError(error?.response?.data?.message || 'Failed to submit mentor application.');
    }
  };

  const renderPendingRequests = () => {
    if (pendingRequestsLoading) {
      return (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      );
    }
    if (pendingRequests.length === 0) {
      return (
        <EmptyState
          title="No pending requests"
          description="New mentorship requests will appear here as they come in."
        />
      );
    }
    return (
      <div className="space-y-3">
        {pendingRequests.map((request: MentorshipRequest) => {
          const mentee = typeof request.mentee === 'string' ? null : request.mentee;
          return (
            <div
              key={request._id}
              className="rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-200"
            >
              <p className="font-medium">{mentee?.username || 'Mentee'}</p>
              {request.message && (
                <p className="mt-1 text-gray-400 line-clamp-2">{request.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Sent {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          );
        })}
        <Link href="/mentorship">
          <Button variant="outline" className="w-full">
            Review All Requests
          </Button>
        </Link>
      </div>
    );
  };

  const renderApplicationSection = () => {
    if (applicationLoading) {
      return (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (application) {
      return (
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-100">Application Status</CardTitle>
                <p className="text-sm text-gray-400">
                  Submitted {new Date(application.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={STATUS_COLORS[application.status]} className="capitalize">
                {application.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-300">
            <p>{application.motivation}</p>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Specialties</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {application.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
            {application.autoEvaluation && (
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <p className="text-gray-500">Level</p>
                  <p className="text-base text-gray-100">{application.autoEvaluation.level}</p>
                </div>
                <div>
                  <p className="text-gray-500">Courses Completed</p>
                  <p className="text-base text-gray-100">
                    {application.autoEvaluation.coursesCompleted}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Avg Rating</p>
                  <p className="text-base text-gray-100">
                    {application.autoEvaluation.averageRating.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Warnings</p>
                  <p className="text-base text-gray-100">{application.autoEvaluation.warningCount}</p>
                </div>
              </div>
            )}
            {application.status === 'rejected' && application.rejectionReason && (
              <p className="rounded-md border border-red-600/50 bg-red-900/20 p-3 text-sm text-red-200">
                {application.rejectionReason}
              </p>
            )}
            {application.status !== 'pending' && (
              <p className="text-xs text-gray-500">
                Need to update your answers? Contact support to edit your application.
              </p>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Become a Mentor</CardTitle>
          <p className="text-sm text-gray-400">
            Share your expertise with the community. Applications are reviewed within a few days.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Why do you want to mentor?"
            value={formState.motivation}
            onChange={(event) => setFormState((prev) => ({ ...prev, motivation: event.target.value }))}
            rows={4}
          />
          <Textarea
            label="Specialties"
            helperText="Separate with commas (e.g. React, Systems Design, Career Coaching)"
            value={formState.specialties}
            onChange={(event) => setFormState((prev) => ({ ...prev, specialties: event.target.value }))}
            rows={2}
          />
          <Textarea
            label="Relevant Experience"
            value={formState.experience}
            onChange={(event) => setFormState((prev) => ({ ...prev, experience: event.target.value }))}
            rows={3}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Hours per week"
              type="number"
              value={formState.hoursPerWeek}
              onChange={(event) => setFormState((prev) => ({ ...prev, hoursPerWeek: event.target.value }))}
            />
            <Input
              label="Timezone"
              value={formState.timezone}
              onChange={(event) => setFormState((prev) => ({ ...prev, timezone: event.target.value }))}
            />
            <Input
              label="Max mentees"
              type="number"
              min={1}
              max={20}
              value={formState.maxMentees}
              onChange={(event) => setFormState((prev) => ({ ...prev, maxMentees: event.target.value }))}
            />
          </div>
          <Textarea
            label="Preferred Meeting Times"
            helperText="Examples: Weeknights after 6pm, Saturday mornings"
            value={formState.preferredTimes}
            onChange={(event) => setFormState((prev) => ({ ...prev, preferredTimes: event.target.value }))}
            rows={2}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/mentorship">
              <Button variant="ghost">Back to Mentorships</Button>
            </Link>
            <Button onClick={handleSubmitApplication} isLoading={submitApplication.isPending}>
              Submit Application
            </Button>
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
            title="Mentor Settings"
            description="Control your mentor availability, track requests, and manage your application."
            actions={
              <Link href="/mentorship">
                <Button variant="outline">Back to Mentorship Hub</Button>
              </Link>
            }
          />

          {actionError && (
            <div className="mb-4">
              <ErrorMessage message={actionError} />
            </div>
          )}

          {isMentor ? (
            <div className="space-y-8">
              <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-sm text-gray-500">Availability</p>
                    <CardTitle className="text-2xl text-gray-100">
                      {user?.mentorStatus?.isAvailable ? 'Open to Requests' : 'Currently Paused'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant={user?.mentorStatus?.isAvailable ? 'outline' : 'primary'}
                      onClick={handleAvailabilityToggle}
                      isLoading={availabilityToggleLoading || updateAvailability.isPending}
                      className="w-full"
                    >
                      {user?.mentorStatus?.isAvailable ? 'Pause Mentorships' : 'Enable Availability'}
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-sm text-gray-500">Active Mentorships</p>
                    <CardTitle className="text-2xl text-gray-100">
                      {user?.mentorStatus?.stats?.activeMentorships ?? 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">
                      Completed: {user?.mentorStatus?.stats?.completedMentorships ?? 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-sm text-gray-500">Average Rating</p>
                    <CardTitle className="text-2xl text-gray-100">
                      {(user?.mentorStatus?.stats?.averageRating ?? 0).toFixed(1)} / 5
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">
                      Total mentees: {user?.mentorStatus?.stats?.totalMentees ?? 0}
                    </p>
                  </CardContent>
                </Card>
              </section>

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border-gray-700 bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-gray-100">Mentor Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-300">
                    <p>
                      <span className="text-gray-500">Bio:</span>{' '}
                      {user?.mentorStatus?.mentorBio || 'No mentor bio set yet.'}
                    </p>
                    <p>
                      <span className="text-gray-500">Specialties:</span>{' '}
                      {user?.mentorStatus?.specialties?.join(', ') || 'N/A'}
                    </p>
                    <p>
                      <span className="text-gray-500">Max Mentees:</span>{' '}
                      {user?.mentorStatus?.maxMentees ?? 5}
                    </p>
                    <p>
                      <span className="text-gray-500">Preferred Communication:</span>{' '}
                      {user?.mentorStatus?.preferredCommunicationMethod || 'message'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Want to update your mentor profile? Contact support so we can keep your profile consistent across requests.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gray-700 bg-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-100">Pending Requests</CardTitle>
                      <Badge variant="warning">{pendingRequests.length} waiting</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>{renderPendingRequests()}</CardContent>
                </Card>
              </section>
            </div>
          ) : (
            <section className="space-y-6">
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-100">Mentor Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-300">
                  <p>✔️ Earn XP bonuses for each session you host.</p>
                  <p>✔️ Build a public mentor profile so mentees can discover you.</p>
                  <p>✔️ Track mentorship outcomes and celebrate mentee wins.</p>
                </CardContent>
              </Card>
              {renderApplicationSection()}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}


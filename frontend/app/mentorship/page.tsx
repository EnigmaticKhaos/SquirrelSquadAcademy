'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { PageHeader } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Textarea,
  Input,
  LoadingSpinner,
  EmptyState,
  Modal,
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  useMentorApplication,
  usePotentialMentors,
  useMentorships,
  useMentorshipRequests,
  useSendMentorshipRequest,
  useRespondToMentorshipRequest,
} from '@/hooks/useMentorship';
import type { PotentialMentor } from '@/types';

const getUserId = (value: string | { _id: string }) => (typeof value === 'string' ? value : value?._id);

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
};

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
};

const communicationOptions = [
  { value: 'message', label: 'Async messaging' },
  { value: 'video', label: 'Live video sessions' },
  { value: 'both', label: 'Mix of both' },
] as const;

export default function MentorshipPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedMentor, setSelectedMentor] = useState<PotentialMentor | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [goalsInput, setGoalsInput] = useState('');
  const [communicationPreference, setCommunicationPreference] = useState<'message' | 'video' | 'both'>('message');
  const [duration, setDuration] = useState('8');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: application, isLoading: applicationLoading } = useMentorApplication();
  const {
    data: mentors = [],
    isLoading: mentorsLoading,
    refetch: refetchMentors,
  } = usePotentialMentors({ limit: 6 }, { enabled: !!user });
  const { data: mentorships = [], isLoading: mentorshipsLoading } = useMentorships(undefined, { enabled: !!user });
  const { data: incomingRequests = [], isLoading: incomingLoading } = useMentorshipRequests(
    { type: 'incoming' },
    { enabled: !!user }
  );
  const { data: outgoingRequests = [], isLoading: outgoingLoading } = useMentorshipRequests(
    { type: 'outgoing' },
    { enabled: !!user }
  );

  const sendRequestMutation = useSendMentorshipRequest();
  const respondMutation = useRespondToMentorshipRequest();

  const isMentor = Boolean(user?.mentorStatus?.isMentor);
  const showLoginPrompt = !user;

  const handleOpenRequest = (mentor: PotentialMentor) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setSelectedMentor(mentor);
    setRequestMessage('');
    setGoalsInput('');
    setCommunicationPreference('message');
    setDuration('8');
    setFormError(null);
  };

  const handleSendRequest = async () => {
    if (!selectedMentor) return;
    if (!requestMessage.trim()) {
      setFormError('Please share a short message introducing yourself.');
      return;
    }

    try {
      setFormError(null);
      await sendRequestMutation.mutateAsync({
        mentorId: selectedMentor.user._id,
        message: requestMessage.trim(),
        goals: goalsInput
          .split(',')
          .map((goal) => goal.trim())
          .filter(Boolean),
        preferredCommunicationMethod: communicationPreference,
        expectedDuration: duration ? Number(duration) : undefined,
      });
      setSelectedMentor(null);
      refetchMentors();
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  };

  const handleRespond = async (requestId: string, accept: boolean) => {
    try {
      await respondMutation.mutateAsync({ requestId, accept });
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  };

  if (showLoginPrompt) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="max-w-md border-gray-800 bg-gray-850 text-gray-100">
            <CardContent className="space-y-5 p-6 text-center">
              <CardTitle>Mentorship Program</CardTitle>
              <p className="text-sm text-gray-400">
                Log in to apply as a mentor, request mentorship, or manage your sessions.
              </p>
              <Button className="w-full" onClick={() => router.push('/login')}>
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
            title="Mentorship"
            description="Apply to mentor others, discover top mentors, and keep your sessions organized."
            actions={
              <Button variant="primary" onClick={() => router.push('/mentorship/apply')}>
                {isMentor ? 'Update mentor profile' : 'Apply to become a mentor'}
              </Button>
            }
          />

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-gray-800 bg-gray-850 text-gray-100">
              <CardHeader className="flex items-start justify-between">
                <div>
                  <CardTitle>Mentor Status</CardTitle>
                  <p className="text-sm text-gray-400">
                    Track your application or manage your mentor availability.
                  </p>
                </div>
                <Badge variant={isMentor ? 'success' : application ? 'warning' : 'secondary'}>
                  {isMentor ? 'Approved' : application ? application.status : 'Not applied'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-300">
                {applicationLoading ? (
                  <div className="flex items-center gap-3">
                    <LoadingSpinner size="sm" />
                    <span>Loading application...</span>
                  </div>
                ) : application ? (
                  <>
                    <p>
                      Submitted on <span className="text-gray-100">{formatDate(application.createdAt)}</span>
                    </p>
                    <p>Status: <span className="text-gray-100 capitalize">{application.status}</span></p>
                    {application.reviewNotes && <p>Notes: {application.reviewNotes}</p>}
                    {application.rejectionReason && (
                      <p className="text-red-300">Reason: {application.rejectionReason}</p>
                    )}
                  </>
                ) : (
                  <p>You haven’t applied yet. Submit an application to mentor learners across the community.</p>
                )}
                <Button variant="outline" onClick={() => router.push('/mentorship/apply')}>
                  {application || isMentor ? 'View application' : 'Start application'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-850 text-gray-100">
              <CardHeader>
                <CardTitle>Active Mentorships</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mentorshipsLoading ? (
                  <div className="flex items-center gap-3">
                    <LoadingSpinner size="sm" />
                    <span>Loading mentorships...</span>
                  </div>
                ) : mentorships.length === 0 ? (
                  <EmptyState
                    title="No mentorships yet"
                    description="Your active mentorships will appear here. Request a mentor or accept an invitation to get started."
                    className="bg-gray-900/50 text-gray-400"
                  />
                ) : (
                  mentorships.slice(0, 3).map((mentorship) => {
                    const isCurrentMentor = getUserId(mentorship.mentor) === user?._id;
                    const counterpart =
                      isCurrentMentor
                        ? typeof mentorship.mentee === 'string'
                          ? null
                          : mentorship.mentee
                        : typeof mentorship.mentor === 'string'
                          ? null
                          : mentorship.mentor;
                    return (
                      <div
                        key={mentorship._id}
                        className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-gray-400">
                              {isCurrentMentor ? 'Mentoring' : 'Mentored by'}
                            </p>
                            <p className="text-lg font-semibold text-gray-100">
                              {counterpart?.username ?? 'Learner'}
                            </p>
                          </div>
                          <Badge
                            variant={
                              mentorship.status === 'active'
                                ? 'success'
                                : mentorship.status === 'pending'
                                  ? 'info'
                                  : mentorship.status === 'completed'
                                    ? 'secondary'
                                    : 'danger'
                            }
                            className="capitalize"
                          >
                            {mentorship.status}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-gray-400">
                          Goals: {mentorship.goals.slice(0, 2).join(', ') || 'Not provided'}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/mentorship/${mentorship._id}`)}
                          >
                            View details
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mentor directory */}
          <section className="mt-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-100">Recommended mentors</h2>
                <p className="text-sm text-gray-400">Matched based on your completed courses and goals.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetchMentors()}>
                Refresh matches
              </Button>
            </div>
            {mentorsLoading ? (
              <div className="flex items-center gap-3 text-gray-400">
                <LoadingSpinner size="sm" />
                <span>Finding mentors for you...</span>
              </div>
            ) : mentors.length === 0 ? (
              <EmptyState
                title="No mentors available yet"
                description="Once more mentors are active, you’ll see your top matches here."
                className="bg-gray-900/50 text-gray-400"
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {mentors.map((mentor) => (
                  <Card key={mentor.user._id} className="border-gray-800 bg-gray-850 text-gray-100">
                    <CardContent className="space-y-3 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold text-gray-100">{mentor.user.username}</p>
                          <p className="text-sm text-gray-400">{mentor.user.bio || 'Mentor'}</p>
                        </div>
                        <Badge variant="info">Match {mentor.matchScore}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                        <span>{mentor.experience} experience</span>
                        <span>{mentor.completedCourses} courses completed</span>
                        {mentor.user.level && <span>Level {mentor.user.level}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleOpenRequest(mentor)}>
                          Request mentorship
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/profile/${mentor.user._id}`)}
                        >
                          View profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Requests */}
          <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-gray-800 bg-gray-850 text-gray-100">
              <CardHeader>
                <CardTitle>Incoming requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {incomingLoading ? (
                  <div className="flex items-center gap-3">
                    <LoadingSpinner size="sm" />
                    <span>Loading requests...</span>
                  </div>
                ) : incomingRequests.length === 0 ? (
                  <EmptyState
                    title="No pending requests"
                    description="New mentees will appear here when they request you."
                    className="bg-gray-900/50 text-gray-400"
                  />
                ) : (
                  incomingRequests.map((request) => {
                    const mentee = typeof request.mentee === 'string' ? null : request.mentee;
                    return (
                      <div
                        key={request._id}
                        className="rounded-xl border border-gray-800 bg-gray-900/40 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-100">{mentee?.username ?? 'Learner'}</p>
                            <p className="text-xs text-gray-400">Requested on {formatDate(request.createdAt)}</p>
                          </div>
                          <Badge
                            variant={
                              request.status === 'pending'
                                ? 'info'
                                : request.status === 'accepted'
                                  ? 'success'
                                  : 'danger'
                            }
                            className="capitalize"
                          >
                            {request.status}
                          </Badge>
                        </div>
                        {request.goals && request.goals.length > 0 && (
                          <p className="mt-2 text-sm text-gray-400">
                            Goals: {request.goals.slice(0, 3).join(', ')}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-gray-300">{request.message}</p>
                        {request.status === 'pending' && (
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              isLoading={respondMutation.isPending}
                              onClick={() => handleRespond(request._id, true)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              isLoading={respondMutation.isPending}
                              onClick={() => handleRespond(request._id, false)}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-850 text-gray-100">
              <CardHeader>
                <CardTitle>My requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {outgoingLoading ? (
                  <div className="flex items-center gap-3">
                    <LoadingSpinner size="sm" />
                    <span>Loading requests...</span>
                  </div>
                ) : outgoingRequests.length === 0 ? (
                  <EmptyState
                    title="No outgoing requests"
                    description="When you reach out to mentors, your requests will be tracked here."
                    className="bg-gray-900/50 text-gray-400"
                  />
                ) : (
                  outgoingRequests.map((request) => {
                    const mentor = typeof request.mentor === 'string' ? null : request.mentor;
                    return (
                      <div key={request._id} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-100">{mentor?.username ?? 'Mentor'}</p>
                            <p className="text-xs text-gray-400">Sent on {formatDate(request.createdAt)}</p>
                          </div>
                          <Badge
                            variant={
                              request.status === 'pending'
                                ? 'info'
                                : request.status === 'accepted'
                                  ? 'success'
                                  : 'danger'
                            }
                            className="capitalize"
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-gray-300 line-clamp-3">{request.message}</p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Modal
        isOpen={Boolean(selectedMentor)}
        onClose={() => setSelectedMentor(null)}
        title={selectedMentor ? `Request mentorship from ${selectedMentor.user.username}` : undefined}
        size="lg"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            Share what you’re working on, how often you’d like to meet, and how they can help.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Message</label>
            <Textarea
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
              rows={4}
              placeholder="Introduce yourself, your goals, and why you selected this mentor."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Goals (comma separated)</label>
            <Input
              value={goalsInput}
              onChange={(event) => setGoalsInput(event.target.value)}
              placeholder="Portfolio review, system design, interview prep..."
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Preferred communication</label>
              <div className="flex flex-wrap gap-2">
                {communicationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCommunicationPreference(option.value)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      communicationPreference === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Expected duration (weeks)</label>
              <Input
                type="number"
                min="1"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelectedMentor(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={sendRequestMutation.isPending}
              onClick={handleSendRequest}
            >
              Send request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

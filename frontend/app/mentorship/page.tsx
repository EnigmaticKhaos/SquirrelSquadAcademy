'use client';

import { useMemo, useState } from 'react';
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
  Modal,
  Select,
  Textarea,
} from '@/components/ui';
import {
  useAddMentorshipMilestone,
  useAddMentorshipSession,
  useCompleteMentorship,
  useCompleteMentorshipMilestone,
  useCreateMentorshipRequest,
  useMentorSuggestions,
  useMentorships,
  useMentorshipRequests,
  useRespondMentorshipRequest,
} from '@/hooks/useMentorship';
import type {
  MentorSuggestion,
  Mentorship,
  MentorshipRequest,
  MentorshipStatus,
  MentorshipCommunicationMethod,
} from '@/types';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'mentor', label: 'As Mentor' },
  { value: 'mentee', label: 'As Mentee' },
];

const STATUS_OPTIONS: Array<{ value: MentorshipStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const REQUEST_TABS = [
  { value: 'incoming', label: 'Incoming Requests' },
  { value: 'outgoing', label: 'Sent Requests' },
];

const COMMUNICATION_OPTIONS: Array<{ value: MentorshipCommunicationMethod; label: string }> = [
  { value: 'message', label: 'Messages' },
  { value: 'video', label: 'Video Calls' },
  { value: 'both', label: 'Messages + Video' },
];

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString();
};

const formatDuration = (duration?: number) => {
  if (!duration) return '—';
  if (duration >= 60) {
    const hours = (duration / 60).toFixed(1);
    return `${hours} hr`;
  }
  return `${duration} min`;
};

const parseList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function MentorshipPage() {
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<MentorshipStatus | 'all'>('active');
  const [requestTab, setRequestTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | string>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  const [sessionModal, setSessionModal] = useState<{ open: boolean; mentorshipId: string | null }>({
    open: false,
    mentorshipId: null,
  });
  const [sessionForm, setSessionForm] = useState({
    date: '',
    duration: '',
    notes: '',
    goalsDiscussed: '',
    nextSteps: '',
    rating: '',
    feedback: '',
  });

  const [milestoneModal, setMilestoneModal] = useState<{ open: boolean; mentorshipId: string | null }>({
    open: false,
    mentorshipId: null,
  });
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', targetDate: '' });

  const [requestModal, setRequestModal] = useState<{ open: boolean; mentor: MentorSuggestion | null }>({
    open: false,
    mentor: null,
  });
  const [requestForm, setRequestForm] = useState({
    message: '',
    goals: '',
    preferredCommunicationMethod: 'message',
    expectedDuration: '',
  });

  const [completeModal, setCompleteModal] = useState<{ open: boolean; mentorshipId: string | null }>({
    open: false,
    mentorshipId: null,
  });
  const [completeForm, setCompleteForm] = useState({ rating: '5', feedback: '' });

  const mentorshipFilters = useMemo(() => {
    return {
      role: roleFilter === 'all' ? undefined : (roleFilter as 'mentor' | 'mentee'),
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 20,
    };
  }, [roleFilter, statusFilter]);

  const requestFilters = useMemo(() => {
    return {
      type: requestTab,
      status: requestStatusFilter === 'all' ? undefined : requestStatusFilter,
      limit: 30,
    };
  }, [requestTab, requestStatusFilter]);

  const { data: mentorshipData, isLoading: mentorshipLoading } = useMentorships(mentorshipFilters);
  const { data: requestData, isLoading: requestsLoading } = useMentorshipRequests(requestFilters);
  const { data: mentors, isLoading: mentorsLoading } = useMentorSuggestions({ limit: 6 });

  const addSession = useAddMentorshipSession();
  const addMilestone = useAddMentorshipMilestone();
  const completeMilestone = useCompleteMentorshipMilestone();
  const completeMentorship = useCompleteMentorship();
  const createRequest = useCreateMentorshipRequest();
  const respondRequest = useRespondMentorshipRequest();

  const mentorships = mentorshipData?.mentorships || [];
  const requests = requestData?.requests || [];

  const activeStats = useMemo(() => {
    const stats = { pending: 0, active: 0, completed: 0 };
    mentorships.forEach((mentorship) => {
      if (mentorship.status === 'completed') stats.completed += 1;
      else if (mentorship.status === 'active') stats.active += 1;
      else if (mentorship.status === 'pending') stats.pending += 1;
    });
    return stats;
  }, [mentorships]);

  const closeSessionModal = () => {
    setSessionModal({ open: false, mentorshipId: null });
    setSessionForm({
      date: '',
      duration: '',
      notes: '',
      goalsDiscussed: '',
      nextSteps: '',
      rating: '',
      feedback: '',
    });
  };

  const closeMilestoneModal = () => {
    setMilestoneModal({ open: false, mentorshipId: null });
    setMilestoneForm({ title: '', description: '', targetDate: '' });
  };

  const closeRequestModal = () => {
    setRequestModal({ open: false, mentor: null });
    setRequestForm({
      message: '',
      goals: '',
      preferredCommunicationMethod: 'message',
      expectedDuration: '',
    });
  };

  const closeCompleteModal = () => {
    setCompleteModal({ open: false, mentorshipId: null });
    setCompleteForm({ rating: '5', feedback: '' });
  };

  const handleAddSession = async () => {
    if (!sessionModal.mentorshipId || !sessionForm.date) {
      setActionError('Please provide a session date.');
      return;
    }
    setActionError(null);
    try {
      await addSession.mutateAsync({
        id: sessionModal.mentorshipId,
        data: {
          date: new Date(sessionForm.date).toISOString(),
          duration: sessionForm.duration ? Number(sessionForm.duration) : undefined,
          notes: sessionForm.notes || undefined,
          goalsDiscussed: parseList(sessionForm.goalsDiscussed),
          nextSteps: parseList(sessionForm.nextSteps),
          rating: sessionForm.rating ? Number(sessionForm.rating) : undefined,
          feedback: sessionForm.feedback || undefined,
        },
      });
      closeSessionModal();
    } catch (error: any) {
      setActionError(error?.response?.data?.message || 'Failed to add session.');
    }
  };

  const handleAddMilestone = async () => {
    if (!milestoneModal.mentorshipId || !milestoneForm.title.trim()) {
      setActionError('Milestone title is required.');
      return;
    }
    setActionError(null);
    try {
      await addMilestone.mutateAsync({
        id: milestoneModal.mentorshipId,
        data: {
          title: milestoneForm.title.trim(),
          description: milestoneForm.description || undefined,
          targetDate: milestoneForm.targetDate ? new Date(milestoneForm.targetDate).toISOString() : undefined,
        },
      });
      closeMilestoneModal();
    } catch (error: any) {
      setActionError(error?.response?.data?.message || 'Failed to add milestone.');
    }
  };

  const handleCompleteMilestone = async (mentorshipId: string, milestoneId: string) => {
    setActionError(null);
    try {
      await completeMilestone.mutateAsync({ id: mentorshipId, milestoneId });
    } catch (error: any) {
      setActionError(error?.response?.data?.message || 'Failed to complete milestone.');
    }
  };

  const handleCompleteMentorship = async () => {
    if (!completeModal.mentorshipId) return;
    setActionError(null);
    try {
      await completeMentorship.mutateAsync({
        id: completeModal.mentorshipId,
        data: {
          rating: completeForm.rating ? Number(completeForm.rating) : undefined,
          feedback: completeForm.feedback || undefined,
        },
      });
      closeCompleteModal();
    } catch (error: any) {
      setActionError(error?.response?.data?.message || 'Failed to complete mentorship.');
    }
  };

  const handleSendRequest = async () => {
    if (!requestModal.mentor) {
      setActionError('Please choose a mentor.');
      return;
    }
    setActionError(null);
    try {
      await createRequest.mutateAsync({
        mentorId: (requestModal.mentor.user as any)?._id || requestModal.mentor.user._id,
        message: requestForm.message || undefined,
        goals: parseList(requestForm.goals),
        preferredCommunicationMethod: requestForm.preferredCommunicationMethod as MentorshipCommunicationMethod,
        expectedDuration: requestForm.expectedDuration ? Number(requestForm.expectedDuration) : undefined,
      });
      closeRequestModal();
    } catch (error: any) {
      setActionError(error?.response?.data?.message || 'Failed to send mentorship request.');
    }
  };

  const handleRespondRequest = async (requestId: string, accept: boolean) => {
    setActionError(null);
    try {
      await respondRequest.mutateAsync({ id: requestId, accept });
    } catch (error: any) {
      setActionError(error?.response?.data?.message || 'Failed to respond to mentorship request.');
    }
  };

  const renderMentorshipCard = (mentorship: Mentorship) => {
    const mentorUser = typeof mentorship.mentor === 'string' ? null : mentorship.mentor;
    const menteeUser = typeof mentorship.mentee === 'string' ? null : mentorship.mentee;
    return (
      <Card key={mentorship._id} className="border-gray-700 bg-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">
                Mentor:{' '}
                <span className="text-gray-100 font-medium">
                  {mentorUser?.username || (typeof mentorship.mentor === 'string' ? 'Mentor' : 'Mentor')}
                </span>
              </p>
              <p className="text-sm text-gray-400">
                Mentee:{' '}
                <span className="text-gray-100 font-medium">
                  {menteeUser?.username || (typeof mentorship.mentee === 'string' ? 'You' : 'Mentee')}
                </span>
              </p>
            </div>
            <Badge
              className="capitalize"
              variant={
                mentorship.status === 'completed'
                  ? 'success'
                  : mentorship.status === 'active'
                  ? 'info'
                  : mentorship.status === 'pending'
                  ? 'warning'
                  : 'secondary'
              }
            >
              {mentorship.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Goals</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {mentorship.goals.map((goal) => (
                <Badge key={goal} variant="secondary">
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="text-gray-100">{formatDate(mentorship.startDate || mentorship.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">Preferred Communication</p>
              <p className="text-gray-100 capitalize">{mentorship.preferredCommunicationMethod || 'message'}</p>
            </div>
            <div>
              <p className="text-gray-500">Sessions Logged</p>
              <p className="text-gray-100">{mentorship.sessions.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Milestones</p>
              <p className="text-gray-100">
                {mentorship.milestones.filter((m) => m.completed).length}/{mentorship.milestones.length}
              </p>
            </div>
          </div>

          {mentorship.milestones.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Milestones</p>
              <div className="space-y-2">
                {mentorship.milestones.slice(0, 3).map((milestone) => (
                  <div
                    key={milestone._id}
                    className="flex items-center justify-between rounded-md border border-gray-700 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="text-gray-200">{milestone.title}</p>
                      <p className="text-xs text-gray-500">
                        Due {milestone.targetDate ? formatDate(milestone.targetDate) : 'flexible'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={milestone.completed ? 'secondary' : 'outline'}
                      disabled={milestone.completed}
                      onClick={() => handleCompleteMilestone(mentorship._id, milestone._id)}
                    >
                      {milestone.completed ? 'Done' : 'Mark Done'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {mentorship.status === 'active' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSessionModal({ open: true, mentorshipId: mentorship._id })}
                >
                  Log Session
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMilestoneModal({ open: true, mentorshipId: mentorship._id })}
                >
                  Add Milestone
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCompleteModal({ open: true, mentorshipId: mentorship._id })}
                >
                  Complete Mentorship
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRequestCard = (request: MentorshipRequest) => {
    const mentorUser = typeof request.mentor === 'string' ? null : request.mentor;
    const menteeUser = typeof request.mentee === 'string' ? null : request.mentee;
    const isIncoming = requestTab === 'incoming';
    return (
      <Card key={request._id} className="border-gray-700 bg-gray-800">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">
                {isIncoming ? 'From' : 'To'}{' '}
                <span className="text-gray-100 font-medium">
                  {isIncoming ? menteeUser?.username || 'Mentee' : mentorUser?.username || 'Mentor'}
                </span>
              </p>
              <p className="text-xs text-gray-500">Sent {formatDate(request.createdAt)}</p>
            </div>
            <Badge
              variant={
                request.status === 'accepted'
                  ? 'success'
                  : request.status === 'pending'
                  ? 'warning'
                  : request.status === 'rejected'
                  ? 'danger'
                  : 'secondary'
              }
              className="capitalize"
            >
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {request.message && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Message</p>
              <p className="mt-1 text-sm text-gray-200">{request.message}</p>
            </div>
          )}
          {request.goals && request.goals.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Goals</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {request.goals.map((goal) => (
                  <Badge key={goal} variant="secondary">
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Preferred: {request.preferredCommunicationMethod || 'message'} · Duration:{' '}
            {request.expectedDuration ? `${request.expectedDuration} weeks` : 'Flexible'}
          </p>

          {isIncoming && request.status === 'pending' && (
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="primary"
                isLoading={respondRequest.isPending}
                onClick={() => handleRespondRequest(request._id, true)}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={respondRequest.isPending}
                onClick={() => handleRespondRequest(request._id, false)}
              >
                Decline
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderMentorSuggestion = (suggestion: MentorSuggestion) => {
    const user = suggestion.user;
    return (
      <Card key={(user as any)._id || user._id} className="border-gray-700 bg-gray-800">
        <CardContent className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 font-medium">{user.username}</p>
              <p className="text-sm text-gray-400">
                Level {user.level} · XP {user.xp?.toLocaleString?.() ?? user.xp}
              </p>
            </div>
            <Badge variant="secondary">{suggestion.experience}</Badge>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2">{user.bio || 'No mentor bio provided yet.'}</p>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Match score: {suggestion.matchScore.toFixed(1)}</span>
            <span>{suggestion.completedCourses} courses</span>
          </div>
          <Button size="sm" className="w-full" onClick={() => setRequestModal({ open: true, mentor: suggestion })}>
            Request Mentorship
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="Mentorship Hub"
            description="Manage your mentorships, respond to requests, and discover mentors aligned with your goals."
          />

          {actionError && (
            <div className="mb-4">
              <ErrorMessage message={actionError} />
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm text-gray-500">Active Mentorships</p>
                <CardTitle className="text-3xl text-gray-100">{activeStats.active}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm text-gray-500">Pending</p>
                <CardTitle className="text-3xl text-gray-100">{activeStats.pending}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm text-gray-500">Completed</p>
                <CardTitle className="text-3xl text-gray-100">{activeStats.completed}</CardTitle>
              </CardHeader>
            </Card>
          </section>

          <section className="mt-8 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-gray-100">Your Mentorships</h2>
              <div className="flex flex-col gap-4 md:flex-row">
                <Select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  options={ROLE_OPTIONS}
                  className="w-48"
                />
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as MentorshipStatus | 'all')}
                  options={STATUS_OPTIONS}
                  className="w-48"
                />
              </div>
            </div>

            {mentorshipLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : mentorships.length === 0 ? (
              <EmptyState
                title="No mentorships yet"
                description="Start by finding a mentor who fits your learning goals."
                action={{
                  label: 'Find Mentors',
                  onClick: () => setRequestTab('incoming'),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {mentorships.map(renderMentorshipCard)}
              </div>
            )}
          </section>

          <section className="mt-10 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                {REQUEST_TABS.map((tab) => (
                  <Button
                    key={tab.value}
                    variant={requestTab === tab.value ? 'primary' : 'outline'}
                    onClick={() => setRequestTab(tab.value as 'incoming' | 'outgoing')}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <Select
                value={requestStatusFilter}
                onChange={(event) => setRequestStatusFilter(event.target.value)}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                className="w-48"
              />
            </div>

            {requestsLoading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner />
              </div>
            ) : requests.length === 0 ? (
              <EmptyState
                title="No mentorship requests"
                description={
                  requestTab === 'incoming'
                    ? "You're all caught up! New mentorship requests will show up here."
                    : 'Send a mentorship request to mentors who match your interests.'
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {requests.map(renderRequestCard)}
              </div>
            )}
          </section>
            <section className="mt-10 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-100">Suggested Mentors</h2>
                <p className="text-sm text-gray-500">Mentors are picked based on your completed courses.</p>
              </div>
              {mentorsLoading ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner />
                </div>
              ) : mentors && mentors.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mentors.map(renderMentorSuggestion)}
                </div>
              ) : (
                <EmptyState
                  title="No mentor suggestions yet"
                  description="Complete a few more courses to unlock personalized mentor matches."
                />
              )}
            </section>
          </div>
        </main>
      </div>
      <Modal
        isOpen={sessionModal.open}
        onClose={closeSessionModal}
        title="Log Mentorship Session"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Session Date"
            type="datetime-local"
            value={sessionForm.date}
            onChange={(event) => setSessionForm((prev) => ({ ...prev, date: event.target.value }))}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            value={sessionForm.duration}
            onChange={(event) => setSessionForm((prev) => ({ ...prev, duration: event.target.value }))}
          />
          <Textarea
            label="Notes"
            rows={3}
            value={sessionForm.notes}
            onChange={(event) => setSessionForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
          <Textarea
            label="Goals Discussed"
            helperText="Separate items with commas or new lines"
            rows={2}
            value={sessionForm.goalsDiscussed}
            onChange={(event) => setSessionForm((prev) => ({ ...prev, goalsDiscussed: event.target.value }))}
          />
          <Textarea
            label="Next Steps"
            helperText="Separate items with commas or new lines"
            rows={2}
            value={sessionForm.nextSteps}
            onChange={(event) => setSessionForm((prev) => ({ ...prev, nextSteps: event.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rating (1-5)"
              type="number"
              min={1}
              max={5}
              value={sessionForm.rating}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, rating: event.target.value }))}
            />
            <Input
              label="Feedback Summary"
              value={sessionForm.feedback}
              onChange={(event) => setSessionForm((prev) => ({ ...prev, feedback: event.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeSessionModal}>
              Cancel
            </Button>
            <Button onClick={handleAddSession} isLoading={addSession.isPending}>
              Save Session
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={milestoneModal.open}
        onClose={closeMilestoneModal}
        title="Add Milestone"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={milestoneForm.title}
            onChange={(event) => setMilestoneForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <Textarea
            label="Description"
            rows={3}
            value={milestoneForm.description}
            onChange={(event) => setMilestoneForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <Input
            label="Target Date"
            type="date"
            value={milestoneForm.targetDate}
            onChange={(event) => setMilestoneForm((prev) => ({ ...prev, targetDate: event.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeMilestoneModal}>
              Cancel
            </Button>
            <Button onClick={handleAddMilestone} isLoading={addMilestone.isPending}>
              Save Milestone
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={requestModal.open}
        onClose={closeRequestModal}
        title={
          requestModal.mentor
            ? `Request ${requestModal.mentor.user.username}`
            : 'Send Mentorship Request'
        }
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Personal Message"
            rows={3}
            value={requestForm.message}
            onChange={(event) => setRequestForm((prev) => ({ ...prev, message: event.target.value }))}
          />
          <Textarea
            label="Goals"
            helperText="Separate goals with commas or new lines"
            rows={2}
            value={requestForm.goals}
            onChange={(event) => setRequestForm((prev) => ({ ...prev, goals: event.target.value }))}
          />
          <Select
            label="Preferred Communication"
            value={requestForm.preferredCommunicationMethod}
            onChange={(event) =>
              setRequestForm((prev) => ({ ...prev, preferredCommunicationMethod: event.target.value }))
            }
            options={COMMUNICATION_OPTIONS}
          />
          <Input
            label="Expected Duration (weeks)"
            type="number"
            value={requestForm.expectedDuration}
            onChange={(event) => setRequestForm((prev) => ({ ...prev, expectedDuration: event.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeRequestModal}>
              Cancel
            </Button>
            <Button onClick={handleSendRequest} isLoading={createRequest.isPending}>
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={completeModal.open}
        onClose={closeCompleteModal}
        title="Complete Mentorship"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Overall Rating (1-5)"
            type="number"
            min={1}
            max={5}
            value={completeForm.rating}
            onChange={(event) => setCompleteForm((prev) => ({ ...prev, rating: event.target.value }))}
          />
          <Textarea
            label="Feedback"
            rows={3}
            value={completeForm.feedback}
            onChange={(event) => setCompleteForm((prev) => ({ ...prev, feedback: event.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeCompleteModal}>
              Cancel
            </Button>
            <Button onClick={handleCompleteMentorship} isLoading={completeMentorship.isPending}>
              Submit Feedback
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

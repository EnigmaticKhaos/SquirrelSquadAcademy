'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { PageHeader } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSpinner,
  Textarea,
} from '@/components/ui';
import {
  useAskLiveSessionQuestion,
  useJoinLiveSession,
  useLeaveLiveSession,
  useLiveSession,
  useLiveSessionPolls,
  useLiveSessionQuestions,
  useRegisterLiveSession,
  useVoteLiveSessionPoll,
} from '@/hooks/useLiveSessions';

import type { LiveSessionPoll } from '@/types';

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

const LiveSessionDetailPage = () => {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id;

  const { data: sessionData, isLoading } = useLiveSession(sessionId);
  const session = sessionData?.session;
  const participant = sessionData?.participant;

  const { data: polls } = useLiveSessionPolls(sessionId);
  const { data: questions } = useLiveSessionQuestions(sessionId);

  const registerMutation = useRegisterLiveSession();
  const joinMutation = useJoinLiveSession();
  const leaveMutation = useLeaveLiveSession();
  const voteMutation = useVoteLiveSessionPoll();
  const askQuestionMutation = useAskLiveSessionQuestion(sessionId);

  const [questionText, setQuestionText] = useState('');
  const [pollSelections, setPollSelections] = useState<Record<string, string[]>>({});

  const isRegistered = Boolean(participant);
  const canJoin =
    session?.meetingUrl &&
    (session.status === 'live' || (session.status === 'scheduled' && isRegistered));

  const handleRegister = async () => {
    if (!sessionId) return;
    await registerMutation.mutateAsync(sessionId);
  };

  const handleJoin = async () => {
    if (!sessionId) return;
    await joinMutation.mutateAsync(sessionId);
    if (session?.meetingUrl) {
      window.open(session.meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLeave = async () => {
    if (!sessionId) return;
    await leaveMutation.mutateAsync(sessionId);
  };

  const handleAskQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!questionText.trim()) return;
    await askQuestionMutation.mutateAsync({ question: questionText.trim() });
    setQuestionText('');
  };

  const handleVote = async (poll: LiveSessionPoll) => {
    const selections = pollSelections[poll._id] || [];
    if (selections.length === 0) return;
    await voteMutation.mutateAsync({
      pollId: poll._id,
      data: { selectedOptions: selections },
    });
    setPollSelections((prev) => ({
      ...prev,
      [poll._id]: [],
    }));
  };

  const renderPoll = (poll: LiveSessionPoll) => {
    const selections = pollSelections[poll._id] || [];
    const multiple = poll.isMultipleChoice;

    const handleSelection = (option: string) => {
      setPollSelections((prev) => {
        const current = prev[poll._id] || [];
        if (multiple) {
          return {
            ...prev,
            [poll._id]: current.includes(option)
              ? current.filter((value) => value !== option)
              : [...current, option],
          };
        }
        return {
          ...prev,
          [poll._id]: [option],
        };
      });
    };

    return (
      <Card key={poll._id} className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">{poll.question}</CardTitle>
          <p className="text-sm text-gray-400">
            {poll.isMultipleChoice ? 'Multiple choice' : 'Single choice'} ·{' '}
            {poll.totalVotes} votes
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {poll.options.map((option) => {
            const isSelected = selections.includes(option);
            const result = poll.results?.find((item) => item.option === option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelection(option)}
                className={`flex w-full items-center justify-between rounded-md border px-4 py-2 text-left text-sm transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-600'
                }`}
              >
                <span>{option}</span>
                {result && (
                  <span className="text-xs text-gray-400">{`${result.votes} (${Math.round(
                    result.percentage
                  )}%)`}</span>
                )}
              </button>
            );
          })}
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={pollSelections[poll._id]?.length === 0 || voteMutation.isPending}
              onClick={() => handleVote(poll)}
            >
              Submit vote
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading || !sessionId) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <LoadingSpinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-300">
            <p>Session not found.</p>
            <Link href="/live-sessions">
              <Button className="mt-4" variant="outline">
                Back to sessions
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const host = typeof session.host === 'string' ? null : session.host;

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title={session.title}
            description={session.description || 'Live learning session'}
            actions={
              <div className="flex gap-3">
                {session.requireRegistration && !isRegistered && (
                  <Button variant="outline" onClick={handleRegister} disabled={registerMutation.isPending}>
                    Register
                  </Button>
                )}
                {canJoin && (
                  <Button onClick={handleJoin} disabled={joinMutation.isPending}>
                    Join session
                  </Button>
                )}
                {isRegistered && session.status === 'live' && (
                  <Button variant="ghost" onClick={handleLeave} disabled={leaveMutation.isPending}>
                    Leave
                  </Button>
                )}
              </div>
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-100">Session Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <Badge
                      className="mt-1 capitalize"
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
                  <div>
                    <p className="text-sm text-gray-400">Type</p>
                    <p className="text-gray-100 capitalize">
                      {session.sessionType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Scheduled</p>
                    <p className="text-gray-100">{formatDateTime(session.scheduledStartTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Duration</p>
                    <p className="text-gray-100">{formatDuration(session.duration)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Participants</p>
                    <p className="text-gray-100">
                      {session.totalParticipants || 0}{' '}
                      {session.maxParticipants ? `/ ${session.maxParticipants}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Interaction</p>
                    <p className="text-gray-100">
                      {session.allowQuestions ? 'Q&A enabled' : 'Q&A disabled'},{' '}
                      {session.allowPolls ? 'Polls enabled' : 'Polls disabled'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {(session.allowPolls || session.allowQuestions) && (
                <div className="grid gap-6 md:grid-cols-2">
                  {session.allowPolls && (
                    <section>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-100">Live polls</h3>
                        <span className="text-xs uppercase tracking-wide text-gray-500">
                          {polls?.length || 0} polls
                        </span>
                      </div>
                      <div className="space-y-4">
                        {polls && polls.length > 0 ? (
                          polls.map(renderPoll)
                        ) : (
                          <p className="text-sm text-gray-400">No polls active.</p>
                        )}
                      </div>
                    </section>
                  )}

                  {session.allowQuestions && (
                    <section>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-100">Questions</h3>
                        <span className="text-xs uppercase tracking-wide text-gray-500">
                          {questions?.length || 0} questions
                        </span>
                      </div>

                      <form onSubmit={handleAskQuestion} className="space-y-2">
                        <Textarea
                          placeholder="Ask the host anything..."
                          value={questionText}
                          onChange={(event) => setQuestionText(event.target.value)}
                          rows={3}
                        />
                        <Button type="submit" size="sm" disabled={askQuestionMutation.isPending}>
                          Submit question
                        </Button>
                      </form>

                      <div className="mt-4 space-y-3">
                        {questions && questions.length > 0 ? (
                          questions.map((question) => (
                            <Card key={question._id} className="border-gray-700 bg-gray-900">
                              <CardContent className="space-y-1 py-3">
                                <p className="text-sm text-gray-100">{question.question}</p>
                                {question.answer && (
                                  <p className="text-xs text-gray-400">Answer: {question.answer}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{question.upvoteCount} votes</span>
                                  {question.status === 'answered' && (
                                    <Badge variant="secondary">Answered</Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400">No questions yet.</p>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-100">Host details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-300">
                  <p>
                    <span className="text-gray-400">Host:</span>{' '}
                    {host?.username || 'Instructor'}
                  </p>
                  {session.coHosts && session.coHosts.length > 0 && (
                    <p>
                      <span className="text-gray-400">Co-hosts:</span>{' '}
                      {session.coHosts
                        .map((coHost) => (typeof coHost === 'string' ? 'Co-host' : coHost.username))
                        .join(', ')}
                    </p>
                  )}
                  <p>
                    <span className="text-gray-400">Provider:</span> {session.provider.toUpperCase()}
                  </p>
                  {session.meetingUrl && (
                    <p className="break-words text-blue-400">
                      <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                        Meeting link
                      </a>
                    </p>
                  )}
                </CardContent>
              </Card>

              {session.recordingAvailable && session.recordingUrl && (
                <Card className="border-gray-700 bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-gray-100">Recording</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-300">
                      Recording will be available shortly after the session ends.
                    </p>
                    <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full" variant="outline">
                        Watch recording
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}

              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-100">Need help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-300">
                  <p>• Check your calendar invite for reminders.</p>
                  <p>• Test your microphone and camera before joining.</p>
                  <p>• Use the Q&A tab to ask the host anything.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveSessionDetailPage;


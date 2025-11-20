'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { PageHeader, Breadcrumbs } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  LoadingSpinner,
  ErrorMessage,
  Textarea,
  Avatar,
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  useJoinSession,
  useLeaveSession,
  useLiveSession,
  useRegisterForSession,
  useSessionParticipants,
} from '@/hooks/useLiveSessions';
import type { LiveSession, LiveSessionChatMessage, LiveSessionStatus } from '@/types';
import { useSocket } from '@/providers/SocketProvider';

const formatDate = (value?: string) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const statusBadgeVariant: Record<LiveSessionStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  scheduled: 'info',
  live: 'success',
  ended: 'warning',
  cancelled: 'danger',
};

export default function LiveSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { user } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useLiveSession(id, { enabled: !!user && !!id });
  const { data: participantList = [], refetch: refetchParticipants } = useSessionParticipants(id, {
    enabled: !!user && !!id,
  });

  const [chatMessages, setChatMessages] = useState<LiveSessionChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);

  const registerMutation = useRegisterForSession();
  const joinMutation = useJoinSession();
  const leaveMutation = useLeaveSession();

  const session: LiveSession | null = data?.session ?? null;
  const participant = data?.participant;

  const isRegistered = useMemo(() => {
    if (!session || !user) return false;
    return session.registeredUsers?.some((regUser) =>
      typeof regUser === 'string' ? regUser === user._id : regUser._id === user._id
    );
  }, [session, user]);

  const isJoined = participant?.status === 'joined';

  const allowChat = session?.allowChat ?? false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleChatMessage = (message: LiveSessionChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    };

    const handleParticipantJoined = (payload: { user: { _id: string; username: string } }) => {
      setActiveIds((prev) => (prev.includes(payload.user._id) ? prev : [...prev, payload.user._id]));
      setConnectionNotice(`${payload.user.username} joined`);
      setTimeout(() => setConnectionNotice(null), 4000);
    };

    const handleParticipantLeft = (payload: { userId: string }) => {
      setActiveIds((prev) => prev.filter((participantId) => participantId !== payload.userId));
    };

    socket.on('live_session_chat_message', handleChatMessage);
    socket.on('participant_joined', handleParticipantJoined);
    socket.on('participant_left', handleParticipantLeft);

    return () => {
      socket.off('live_session_chat_message', handleChatMessage);
      socket.off('participant_joined', handleParticipantJoined);
      socket.off('participant_left', handleParticipantLeft);
    };
  }, [socket, id]);

  useEffect(() => {
    return () => {
      if (socket && isJoined) {
        socket.emit('live_session_participant_left', { sessionId: id });
        socket.emit('leave_live_session', { sessionId: id });
      }
      if (isJoined) {
        leaveMutation.mutate(id);
      }
    };
  }, [socket, id, isJoined, leaveMutation]);

  const handleRegister = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    registerMutation.mutate(id, {
      onSuccess: () => {
        refetchParticipants();
      },
    });
  };

  const handleJoin = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    joinMutation.mutate(id, {
      onSuccess: () => {
        socket?.emit('join_live_session', { sessionId: id });
        socket?.emit('live_session_participant_joined', { sessionId: id });
        refetchParticipants();
      },
    });
  };

  const handleLeave = () => {
    leaveMutation.mutate(id, {
      onSuccess: () => {
        socket?.emit('live_session_participant_left', { sessionId: id });
        socket?.emit('leave_live_session', { sessionId: id });
        refetchParticipants();
      },
    });
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !socket) return;
    socket.emit('live_session_chat', { sessionId: id, message: chatInput.trim() });
    setChatInput('');
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="max-w-md border-gray-800 bg-gray-850 text-gray-200">
            <CardContent className="space-y-4 p-6 text-center">
              <p className="text-sm text-gray-400">Please sign in to view live session details.</p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
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

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <ErrorMessage message="Live session not found." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Live Sessions', href: '/live-sessions' },
              { label: session.title },
            ]}
          />

          <PageHeader
            title={session.title}
            description={session.description || 'Join the conversation and learn live with others.'}
          />

          {connectionNotice && (
            <div className="mb-4 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
              {connectionNotice}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-gray-800 bg-gray-850 text-gray-100">
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="capitalize">
                      {session.sessionType.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant={statusBadgeVariant[session.status]} className="capitalize">
                      {session.status}
                    </Badge>
                    {session.provider === 'zoom' && <Badge variant="info">Zoom</Badge>}
                  </div>
                  <div className="text-sm text-gray-400">
                    <p>
                      <strong className="text-gray-200">Start:</strong> {formatDate(session.scheduledStartTime)}
                    </p>
                    {session.scheduledEndTime && (
                      <p>
                        <strong className="text-gray-200">End:</strong> {formatDate(session.scheduledEndTime)}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>
                      <strong className="text-gray-200">Host:</strong>{' '}
                      {typeof session.host === 'string' ? 'Host' : session.host.username}
                    </p>
                    <p>
                      <strong className="text-gray-200">Participants:</strong> {session.totalParticipants}
                    </p>
                    {session.meetingUrl && (
                      <p>
                        <strong className="text-gray-200">Meeting Link:</strong>{' '}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => window.open(session.meetingUrl, '_blank')}
                        >
                          Open Meeting
                        </Button>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {session.recordingAvailable && session.recordingUrl && (
                      <Button variant="secondary" onClick={() => window.open(session.recordingUrl, '_blank')}>
                        View Recording
                      </Button>
                    )}
                    {!isRegistered && session.requireRegistration && (
                      <Button
                        variant="secondary"
                        onClick={handleRegister}
                        isLoading={registerMutation.isPending}
                        disabled={registerMutation.isPending}
                      >
                        Register
                      </Button>
                    )}
                    {!isJoined && session.status !== 'ended' && (
                      <Button
                        variant="primary"
                        onClick={handleJoin}
                        isLoading={joinMutation.isPending}
                        disabled={joinMutation.isPending}
                      >
                        Join Session
                      </Button>
                    )}
                    {isJoined && (
                      <Button
                        variant="outline"
                        onClick={handleLeave}
                        isLoading={leaveMutation.isPending}
                        disabled={leaveMutation.isPending}
                      >
                        Leave Session
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {allowChat ? (
                <Card className="border-gray-800 bg-gray-850 text-gray-100">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle>Live Chat</CardTitle>
                    {!isJoined && <Badge variant="warning">Join to chat</Badge>}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-64 overflow-y-auto rounded-lg border border-gray-800 bg-black/70 p-4">
                      {chatMessages.length === 0 ? (
                        <p className="text-sm text-gray-500">Chat messages will appear here once the session is live.</p>
                      ) : (
                        chatMessages.map((message, index) => (
                          <div key={`${message.timestamp}-${index}`} className="mb-3">
                            <p className="text-xs text-gray-500">
                              {message.user.username}{' '}
                              <span className="text-gray-600">
                                · {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </p>
                            <p className="text-sm text-gray-100">{message.message}</p>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="flex flex-col gap-3">
                      <Textarea
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder={isJoined ? 'Share an update with the group...' : 'Join the session to chat.'}
                        disabled={!isJoined || !socket}
                        className="border-gray-700 bg-gray-900 text-gray-100 placeholder:text-gray-500"
                      />
                      <Button onClick={handleSendMessage} disabled={!isJoined || !chatInput.trim()}>
                        Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-800 bg-gray-850 text-gray-100">
                  <CardContent className="p-6 text-sm text-gray-400">
                    Chat is disabled for this session.
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-gray-800 bg-gray-850 text-gray-100">
                  <CardHeader className="flex items-center justify-between">
                  <CardTitle>Participants</CardTitle>
                    <span className="text-xs text-gray-400">
                    {participantList.length} registered · {activeIds.length} online
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  {participantList.length === 0 ? (
                    <p className="text-sm text-gray-500">Participants will appear here once people register.</p>
                  ) : (
                    participantList.map((participant) => {
                      const participantUser =
                        typeof participant.user === 'string' ? undefined : participant.user;
                      const participantId =
                        typeof participant.user === 'string' ? participant.user : participant.user._id;
                      const isOnline = activeIds.includes(participantId);
                      return (
                        <div
                          key={participant._id}
                          className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={participantUser?.profilePhoto}
                              name={participantUser?.username || 'Participant'}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-100">
                                {participantUser?.username || 'Participant'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {participant.role.replace('_', ' ')} · {participant.status}
                              </p>
                            </div>
                          </div>
                          {isOnline && <Badge variant="success" size="sm">Online</Badge>}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-850 text-gray-100">
                <CardHeader>
                  <CardTitle>Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-400">
                  <p>
                    Need help? Visit the{' '}
                    <Link href="/forums" className="text-blue-400 hover:text-blue-300">
                      forums
                    </Link>{' '}
                    or explore{' '}
                    <Link href="/learning-paths" className="text-blue-400 hover:text-blue-300">
                      learning paths
                    </Link>{' '}
                    to prepare for this session.
                  </p>
                  {session.course && typeof session.course === 'object' && (
                    <p>
                      Related course:{' '}
                      <Link href={`/courses/${session.course._id}`} className="text-blue-400 hover:text-blue-300">
                        {session.course.title}
                      </Link>
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

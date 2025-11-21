'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/layout';
import { useSupportTicket, useAddTicketMessage } from '@/hooks/useHelpSupport';
import {
  Card,
  CardContent,
  Badge,
  LoadingSpinner,
  ErrorMessage,
  Button,
  Textarea,
  Avatar,
} from '@/components/ui';
import { showToast, getErrorMessage } from '@/lib/toast';
import { ArrowLeft, Send, User, Clock } from 'lucide-react';

const getStatusColor = (status: string) => {
  const colors = {
    open: 'bg-blue-500/10 text-blue-400',
    in_progress: 'bg-yellow-500/10 text-yellow-400',
    waiting_user: 'bg-orange-500/10 text-orange-400',
    resolved: 'bg-green-500/10 text-green-400',
    closed: 'bg-gray-500/10 text-gray-400',
  };
  return colors[status as keyof typeof colors] || colors.closed;
};

const getPriorityColor = (priority: string) => {
  const colors = {
    low: 'bg-gray-500/10 text-gray-400',
    normal: 'bg-blue-500/10 text-blue-400',
    high: 'bg-orange-500/10 text-orange-400',
    urgent: 'bg-red-500/10 text-red-400',
  };
  return colors[priority as keyof typeof colors] || colors.normal;
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { data: ticket, isLoading, error, refetch } = useSupportTicket(id);
  const addMessage = useAddTicketMessage();
  const [message, setMessage] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      showToast.error('Please enter a message');
      return;
    }

    try {
      await addMessage.mutateAsync({ id, content: message });
      setMessage('');
      refetch();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !ticket) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <ErrorMessage message="Ticket not found" />
        </div>
      </AppLayout>
    );
  }

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/help">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Help Center
          </Button>
        </Link>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <Badge variant="secondary">{ticket.category}</Badge>
                </div>
                <h1 className="text-2xl font-bold text-gray-100 mb-2">
                  {ticket.subject}
                </h1>
                <p className="text-gray-400 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              {ticket.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Assigned to {ticket.assignedTo.username}</span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex items-center gap-2">
                  <span>Resolved {new Date(ticket.resolvedAt).toLocaleString()}</span>
                </div>
              )}
            </div>

            {ticket.resolution && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h3 className="text-sm font-semibold text-green-400 mb-2">Resolution</h3>
                <p className="text-sm text-gray-300">{ticket.resolution}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-100">
            Messages ({ticket.messages?.length || 0})
          </h2>
          {ticket.messages && ticket.messages.length > 0 ? (
            ticket.messages.map((msg, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={msg.sender?.profilePhoto}
                      name={msg.sender?.username || 'User'}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-100">
                          {msg.sender?.username || 'User'}
                        </span>
                        {msg.isInternal && (
                          <Badge variant="secondary" className="text-xs">
                            Internal
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt || new Date().toISOString()).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {msg.attachments.map((att, attIdx) => (
                            <a
                              key={attIdx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-blue-400 hover:text-blue-300"
                            >
                              {att.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No messages yet
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Message Form */}
        {!isResolved && (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Add a message
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={addMessage.isPending || !message.trim()}
                  >
                    {addMessage.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}


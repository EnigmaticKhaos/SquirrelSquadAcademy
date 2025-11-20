'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useConversations } from '@/hooks/useMessages';
import { Card, CardContent, LoadingSpinner, ErrorMessage, EmptyState, Avatar, Badge, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import type { Conversation } from '@/types';
import { MessageSquarePlus } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();
  const { data: conversations, isLoading, error } = useConversations();
  const { user } = useAuth();

  const getOtherParticipant = (conversation: Conversation) => {
    if (!user) return null;
    const participants = Array.isArray(conversation.participants) 
      ? conversation.participants 
      : [];
    return participants.find((p: any) => {
      const participantId = typeof p === 'string' ? p : p._id;
      return participantId !== user._id;
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">Messages</h1>
              <p className="mt-1 text-sm text-gray-400">Chat with other learners and mentors</p>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push('/search?type=users')}
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <ErrorMessage message="Failed to load conversations. Please try again." />
          ) : !conversations || conversations.length === 0 ? (
            <EmptyState
              title="No conversations"
              description="Start a conversation by visiting someone's profile and clicking 'Message'."
            />
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation: Conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                if (!otherParticipant) return null;
                
                const participant = typeof otherParticipant === 'string' 
                  ? { _id: otherParticipant, username: 'Unknown', profilePhoto: undefined, onlineStatus: 'offline' as const }
                  : otherParticipant;
                
                const lastMessage = conversation.lastMessage as any;
                const unreadCount = conversation.unreadCount || 0;

                return (
                  <Link key={conversation._id} href={`/messages/${conversation._id}`}>
                    <Card hover className="cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar
                              src={participant.profilePhoto}
                              name={participant.username}
                              size="md"
                            />
                            {participant.onlineStatus === 'online' && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-semibold text-gray-100 truncate">
                                {participant.username}
                              </h3>
                              <span className="text-xs text-gray-400 ml-2">
                                {formatTime(conversation.updatedAt)}
                              </span>
                            </div>
                            {lastMessage && (
                              <p className="text-sm text-gray-400 truncate">
                                {lastMessage.content}
                              </p>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <Badge variant="info" className="ml-2">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


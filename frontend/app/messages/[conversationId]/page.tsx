'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { useMessages, useSendMessage, useMarkAsRead } from '@/hooks/useMessages';
import { Card, CardContent, LoadingSpinner, ErrorMessage, Button, Avatar } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { Textarea } from '@/components/ui';
import type { Message } from '@/types';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const { user } = useAuth();
  const { data: messagesData, isLoading } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = messagesData?.data || [];

  useEffect(() => {
    if (conversationId) {
      markAsReadMutation.mutate(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        content: messageContent,
      });
      setMessageContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-900">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="mx-auto max-w-4xl w-full px-4 py-4 sm:px-6 lg:px-8 flex flex-col flex-1">
          <PageHeader
            title="Conversation"
            description="Chat with your conversation partner"
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message: Message) => {
                const sender = typeof message.sender === 'string' 
                  ? { _id: message.sender, username: 'Unknown', profilePhoto: undefined }
                  : message.sender;
                const isOwnMessage = user && sender._id === user._id;

                return (
                  <div
                    key={message._id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    {!isOwnMessage && (
                      <Avatar
                        src={sender.profilePhoto}
                        name={sender.username}
                        size="sm"
                      />
                    )}
                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      {!isOwnMessage && (
                        <span className="text-xs text-gray-400 mb-1">{sender.username}</span>
                      )}
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSend} className="border-t border-gray-700 pt-4">
            <div className="flex gap-2">
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type a message..."
                rows={3}
                className="flex-1 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <Button
                type="submit"
                isLoading={sendMessageMutation.isPending}
                disabled={!messageContent.trim()}
                className="self-end"
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}


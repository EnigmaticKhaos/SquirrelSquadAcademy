'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useMessages, useSendMessage, useMarkAsRead, useConversations } from '@/hooks/useMessages';
import { LoadingSpinner, Button, Avatar, Textarea } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import type { Message, Conversation } from '@/types';
import { Paperclip, X, File, Image as ImageIcon, FileText } from 'lucide-react';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { user } = useAuth();
  const { data: messagesData, isLoading } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();
  const [messageContent, setMessageContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<Array<{ file: File; preview: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(() => messagesData?.data ?? [], [messagesData]);

  // Get conversation details to show participant info
  const conversation = conversations?.find((c: Conversation) => c._id === conversationId);
  const otherParticipant = conversation?.participants?.find((participant) => {
    const participantId = typeof participant === 'string' ? participant : participant._id;
    return participantId !== user?._id;
  });
  const participant = typeof otherParticipant === 'string' 
    ? { _id: otherParticipant, username: 'Unknown', profilePhoto: undefined, onlineStatus: 'offline' as const }
    : otherParticipant;

  useEffect(() => {
    if (conversationId) {
      markAsReadMutation.mutate(conversationId);
    }
  }, [conversationId, markAsReadMutation]);

  useEffect(() => {
    if (!conversationId || messages.length === 0 || !user) {
      return;
    }
    const latest = messages[messages.length - 1];
    const senderId = typeof latest.sender === 'string' ? latest.sender : latest.sender?._id;
    if (senderId !== user._id && !latest.isRead) {
      markAsReadMutation.mutate(conversationId);
    }
  }, [conversationId, messages, markAsReadMutation, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const latestPreviewsRef = useRef<Array<{ file: File; preview: string }>>([]);
  useEffect(() => {
    latestPreviewsRef.current = attachmentPreviews;
  }, [attachmentPreviews]);

  useEffect(() => {
    return () => {
      latestPreviewsRef.current.forEach(({ preview }) => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...attachments, ...files];
    setAttachments(newFiles);

    // Create previews for images
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        setAttachmentPreviews((prev) => [...prev, { file, preview }]);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    const fileToRemove = attachments[index];
    setAttachments(attachments.filter((_, i) => i !== index));
    
    // Remove preview if it exists
    const previewIndex = attachmentPreviews.findIndex((p) => p.file === fileToRemove);
    if (previewIndex !== -1) {
      const preview = attachmentPreviews[previewIndex].preview;
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setAttachmentPreviews(attachmentPreviews.filter((_, i) => i !== previewIndex));
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.startsWith('text/') || type.includes('pdf') || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() && attachments.length === 0) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        content: messageContent || '',
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setMessageContent('');
      setAttachments([]);
      // Cleanup previews
      attachmentPreviews.forEach(({ preview }) => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
      setAttachmentPreviews([]);
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
          {/* Conversation Header */}
          {participant && (
            <div className="mb-4 flex items-center gap-3 pb-4 border-b border-gray-700">
              <Avatar
                src={participant.profilePhoto}
                name={participant.username}
                size="md"
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-100">{participant.username}</h2>
                {participant.onlineStatus === 'online' && (
                  <p className="text-xs text-green-400">Online</p>
                )}
              </div>
            </div>
          )}

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
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap mb-2">{message.content}</p>
                        )}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {message.attachments.map((attachment, idx) => {
                              const FileIcon = getFileIcon(attachment.type);
                              const isImage = attachment.type.startsWith('image/');
                              
                              return (
                                <div
                                  key={idx}
                                  className={`${
                                    isOwnMessage
                                      ? 'bg-blue-700/50 border-blue-500/50'
                                      : 'bg-gray-700/50 border-gray-600/50'
                                  } border rounded-lg p-2`}
                                >
                                  {isImage ? (
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="max-w-xs rounded cursor-pointer hover:opacity-90"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 hover:opacity-80"
                                    >
                                      <FileIcon className="w-4 h-4" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs truncate">{attachment.name}</p>
                                        <p className="text-xs opacity-75">
                                          {formatFileSize(attachment.size)}
                                        </p>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
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
            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="mb-3 space-y-2">
                {attachments.map((file, index) => {
                  const preview = attachmentPreviews.find((p) => p.file === file);
                  const FileIcon = getFileIcon(file.type);
                  const isImage = file.type.startsWith('image/');

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 border border-gray-700"
                    >
                      {isImage && preview ? (
                        <img
                          src={preview.preview}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center">
                          <FileIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-100 truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="self-end"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
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
                disabled={!messageContent.trim() && attachments.length === 0}
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


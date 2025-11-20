'use client';

import { api } from '../apiClient';
import type { ApiResponse, Conversation, Message, PaginatedResponse } from '@/types';

export const messagesApi = {
  // Get all conversations
  getConversations: () => api.get<ApiResponse<{ conversations: Conversation[] }>>('/messages/conversations'),
  
  // Get or create conversation with a user
  getOrCreateConversation: (userId: string) => 
    api.get<ApiResponse<{ conversation: Conversation }>>(`/messages/conversations/${userId}`),
  
  // Create new conversation
  createConversation: (userId: string) =>
    api.post<ApiResponse<{ conversation: Conversation }>>('/messages/conversations', { userId }),
  
  // Get messages for a conversation
  getMessages: (conversationId: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return api.get<ApiResponse<PaginatedResponse<Message>>>(
      `/messages/conversations/${conversationId}/messages?${queryParams.toString()}`
    );
  },
  
  // Send a message
  sendMessage: (conversationId: string, content: string, attachments?: File[]) => {
    const formData = new FormData();
    formData.append('content', content);
    if (attachments) {
      attachments.forEach((file) => formData.append('attachments', file));
    }
    return api.post<ApiResponse<{ message: Message }>>(
      `/messages/conversations/${conversationId}/messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
  
  // Mark messages as read
  markAsRead: (conversationId: string) =>
    api.put<ApiResponse<void>>(`/messages/conversations/${conversationId}/read`),
};


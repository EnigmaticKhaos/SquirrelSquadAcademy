import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api';
import type { Conversation, Message, PaginatedResponse } from '@/types';

export const useConversations = () => {
  return useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: () => messagesApi.getConversations().then(res => res.data.data?.conversations || []),
  });
};

export const useConversation = (userId: string) => {
  return useQuery({
    queryKey: ['messages', 'conversation', userId],
    queryFn: () => messagesApi.getOrCreateConversation(userId).then(res => res.data.data?.conversation),
    enabled: !!userId,
  });
};

export const useMessages = (conversationId: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['messages', 'conversation', conversationId, 'messages', params],
    queryFn: () => messagesApi.getMessages(conversationId, params).then(res => res.data.data),
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, content, attachments }: { 
      conversationId: string; 
      content: string; 
      attachments?: File[] 
    }) => messagesApi.sendMessage(conversationId, content, attachments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', variables.conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (conversationId: string) => messagesApi.markAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
  });
};


'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import type { Conversation, Message, Notification, PaginatedResponse } from '@/types';
import { useAuth } from '@/hooks/useAuth';

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!user || !token) {
      return;
    }

    const socketInstance = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socketInstance;

    const handleConnect = () => {
      setIsConnected(true);
      setSocketState(socketInstance);
      socketInstance.emit('join_conversations');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketState(null);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.disconnect();
      socketRef.current = null;
      setSocketState(null);
      setIsConnected(false);
    };
  }, [user?._id, user]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;

    const handleNewMessage = (payload: { message: Message }) => {
      const incoming = payload.message;
      const conversationId = incoming.conversation;

      queryClient.setQueriesData(
        { queryKey: ['messages', 'conversation', conversationId, 'messages'] },
        (previous: PaginatedResponse<Message> | undefined) => {
          if (!previous) {
            return previous;
          }
          if (previous.data.some((message) => message._id === incoming._id)) {
            return previous;
          }
          return {
            ...previous,
            data: [...previous.data, incoming],
            pagination: previous.pagination
              ? {
                  ...previous.pagination,
                  total: (previous.pagination.total ?? previous.data.length) + 1,
                }
              : previous.pagination,
          };
        }
      );

      const senderId = typeof incoming.sender === 'string' ? incoming.sender : incoming.sender?._id;
      const isOwnMessage = senderId === user._id;

      const conversations = queryClient.getQueryData<Conversation[]>(['messages', 'conversations']);
      if (!conversations) {
        queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      } else {
        const index = conversations.findIndex((conversation) => conversation._id === conversationId);
        if (index === -1) {
          queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
        } else {
          const updatedConversation: Conversation = {
            ...conversations[index],
            lastMessage: incoming,
            updatedAt: incoming.createdAt,
            unreadCount: isOwnMessage ? 0 : (conversations[index].unreadCount || 0) + 1,
          };

          const reordered = [...conversations];
          reordered.splice(index, 1);
          reordered.unshift(updatedConversation);

          queryClient.setQueryData(['messages', 'conversations'], reordered);
        }
      }
    };

    const handleNotification = (notification: Notification) => {
      queryClient.setQueryData(['notifications', 'unread-count'], (previous?: number) => (previous || 0) + 1);

      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (previous: PaginatedResponse<Notification> | undefined) => {
          if (!previous) {
            return previous;
          }
          const limit = previous.pagination?.limit;
          const nextData = [notification, ...previous.data];
          return {
            ...previous,
            data: limit ? nextData.slice(0, limit) : nextData,
            pagination: previous.pagination
              ? { ...previous.pagination, total: (previous.pagination.total ?? previous.data.length) + 1 }
              : previous.pagination,
          };
        }
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('notification', handleNotification);
    };
  }, [queryClient, user]);

  const contextValue = useMemo(
    () => ({
      socket: socketState,
      isConnected,
    }),
    [socketState, isConnected]
  );

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);

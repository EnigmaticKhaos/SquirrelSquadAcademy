import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { initializeNotificationSocket } from '../services/notificationService';
import logger from '../utils/logger';

let io: SocketServer;

export const initializeSocket = (httpServer: HTTPServer): SocketServer => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = [
    frontendUrl,
    frontendUrl.replace('https://', 'https://www.'),
    frontendUrl.replace('https://www.', 'https://'),
    'http://localhost:3000',
  ];

  io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Initialize notification service with Socket.io instance
  initializeNotificationSocket(io);

  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info(`User ${user._id} connected`);

    // Update user online status
    User.findByIdAndUpdate(user._id, {
      onlineStatus: 'online',
      lastSeen: new Date(),
    });

    // Join user's personal room
    socket.join(`user:${user._id}`);

    // Join conversation rooms
    socket.on('join_conversations', async () => {
      const conversations = await Conversation.find({
        participants: user._id,
      });

      conversations.forEach((conv) => {
        socket.join(`conversation:${conv._id}`);
      });
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, attachments } = data;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation || !conversation.participants.includes(user._id)) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Encrypt message content
        const { encrypt, decrypt: decryptMessage } = await import('../utils/encryption');
        const encryptedContent = encrypt(content);

        const message = await Message.create({
          conversation: conversationId,
          sender: user._id,
          content: encryptedContent,
          contentEncrypted: true,
          attachments,
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Decrypt message for sending (only to authorized participants)
        const populatedMessage = await message.populate('sender', 'username profilePhoto');
        const messageObj = populatedMessage.toObject();
        
        // Decrypt content for authorized users
        if (messageObj.contentEncrypted) {
          try {
            messageObj.content = decryptMessage(messageObj.content);
          } catch (error) {
            logger.error('Error decrypting message:', error);
            messageObj.content = '[Message decryption error]';
          }
        }

        // Emit to all participants
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message: messageObj,
        });

        // Send notification to other participants
        const otherParticipants = conversation.participants.filter(
          (p: any) => p.toString() !== user._id.toString()
        );
        
        otherParticipants.forEach((participantId: any) => {
          import('../services/notificationService').then(({ createNotification }) => {
            createNotification(participantId.toString(), 'message_received', {
              title: 'New message',
              message: `${user.username} sent you a message`,
              actionUrl: `/messages/${conversationId}`,
              relatedUser: user._id.toString(),
              relatedMessage: message._id.toString(),
              sendEmail: true,
            }).catch((error) => {
              logger.error('Error sending message notification:', error);
            });
          });
        });
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark message as read
    socket.on('mark_read', async (data) => {
      try {
        const { messageId } = data;

        await Message.findByIdAndUpdate(messageId, {
          isRead: true,
          readAt: new Date(),
        });

        socket.emit('message_read', { messageId });
      } catch (error) {
        logger.error('Error marking message as read:', error);
      }
    });

    // ========== Live Session Handlers ==========
    
    // Join live session room
    socket.on('join_live_session', async (data) => {
      try {
        const { sessionId } = data;
        socket.join(`live_session:${sessionId}`);
        logger.info(`User ${user._id} joined live session ${sessionId}`);
      } catch (error) {
        logger.error('Error joining live session:', error);
      }
    });

    // Leave live session room
    socket.on('leave_live_session', async (data) => {
      try {
        const { sessionId } = data;
        socket.leave(`live_session:${sessionId}`);
        logger.info(`User ${user._id} left live session ${sessionId}`);
      } catch (error) {
        logger.error('Error leaving live session:', error);
      }
    });

    // Send chat message in live session
    socket.on('live_session_chat', async (data) => {
      try {
        const { sessionId, message } = data;
        
        // Emit to all participants in the session
        io.to(`live_session:${sessionId}`).emit('live_session_chat_message', {
          user: {
            _id: user._id,
            username: user.username,
            profilePhoto: user.profilePhoto,
          },
          message,
          timestamp: new Date(),
        });

        // Update participant chat message count
        const { default: LiveSessionParticipant } = await import('../models/LiveSessionParticipant');
        await LiveSessionParticipant.findOneAndUpdate(
          { session: sessionId, user: user._id },
          { $inc: { chatMessages: 1 }, $set: { lastActiveAt: new Date() } }
        );
      } catch (error) {
        logger.error('Error sending live session chat:', error);
      }
    });

    // Participant joined
    socket.on('live_session_participant_joined', async (data) => {
      try {
        const { sessionId } = data;
        io.to(`live_session:${sessionId}`).emit('participant_joined', {
          user: {
            _id: user._id,
            username: user.username,
            profilePhoto: user.profilePhoto,
          },
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Error handling participant joined:', error);
      }
    });

    // Participant left
    socket.on('live_session_participant_left', async (data) => {
      try {
        const { sessionId } = data;
        io.to(`live_session:${sessionId}`).emit('participant_left', {
          userId: user._id,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Error handling participant left:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`User ${user._id} disconnected`);
      
      // Update user offline status
      User.findByIdAndUpdate(user._id, {
        onlineStatus: 'offline',
        lastSeen: new Date(),
      });
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};


import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import logger from '../utils/logger';

// @desc    Get user conversations
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const conversations = await Conversation.find({
    participants: userDoc._id,
  })
    .populate('participants', 'username profilePhoto onlineStatus')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

  res.json({
    success: true,
    count: conversations.length,
    conversations,
  });
});

// @desc    Get or create conversation
// @route   GET /api/messages/conversations/:userId
// @route   POST /api/messages/conversations
// @access  Private
export const getOrCreateConversation = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params || req.body;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const currentUserId = userDoc._id;

  if (userId === currentUserId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot create conversation with yourself',
    });
  }

  // Find existing conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, userId] },
  })
    .populate('participants', 'username profilePhoto onlineStatus');

  if (!conversation) {
    // Create new conversation
    conversation = await Conversation.create({
      participants: [currentUserId, userId],
    });
    await conversation.populate('participants', 'username profilePhoto onlineStatus');
  }

  res.json({
    success: true,
    conversation,
  });
});

// @desc    Get messages for a conversation
// @route   GET /api/messages/conversations/:id/messages
// @access  Private
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const conversation = await Conversation.findById(id);

  if (!conversation || !conversation.participants.includes(userDoc._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this conversation',
    });
  }

  const skip = (Number(page) - 1) * Number(limit);

  const messages = await Message.find({ conversation: id })
    .populate('sender', 'username profilePhoto')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Message.countDocuments({ conversation: id });

  // Decrypt messages for authorized user
  const { decrypt } = await import('../utils/encryption');
  const decryptedMessages = messages.map((msg) => {
    const msgObj = msg.toObject();
    if (msgObj.contentEncrypted) {
      try {
        msgObj.content = decrypt(msgObj.content);
      } catch (error) {
        logger.error('Error decrypting message:', error);
        msgObj.content = '[Message decryption error]';
      }
    }
    return msgObj;
  });

  res.json({
    success: true,
    count: decryptedMessages.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    messages: decryptedMessages.reverse(), // Reverse to show oldest first
  });
});


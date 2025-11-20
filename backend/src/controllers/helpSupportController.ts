import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { IUser } from '../models/User';
import {
  createFAQ,
  trackFAQView,
  rateFAQ,
  createHelpArticle,
  trackArticleView,
  rateArticle,
  createSupportTicket,
  addTicketMessage,
  updateTicketStatus,
  assignTicket,
  createVideoTutorial,
  trackTutorialView,
  rateTutorial,
} from '../services/helpSupportService';
import FAQ from '../models/FAQ';
import HelpArticle from '../models/HelpArticle';
import SupportTicket from '../models/SupportTicket';
import VideoTutorial from '../models/VideoTutorial';

// ========== FAQ Endpoints ==========

// @desc    Get all FAQs
// @route   GET /api/help/faqs
// @access  Public
export const getFAQs = asyncHandler(async (req: Request, res: Response) => {
  const { category, featured, search } = req.query;

  const query: any = { isPublished: true };

  if (category) {
    query.category = category;
  }
  if (featured === 'true') {
    query.isFeatured = true;
  }
  if (search) {
    query.$text = { $search: search as string };
  }

  const faqs = await FAQ.find(query)
    .sort({ category: 1, order: 1, createdAt: -1 })
    .populate('lastUpdatedBy', 'username')
    .select(search ? { score: { $meta: 'textScore' } } : {});

  res.json({
    success: true,
    faqs,
  });
});

// @desc    Get single FAQ
// @route   GET /api/help/faqs/:id
// @access  Public
export const getFAQ = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const faq = await FAQ.findById(id).populate('lastUpdatedBy', 'username');

  if (!faq || !faq.isPublished) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found',
    });
  }

  // Track view
  await trackFAQView(id);

  res.json({
    success: true,
    faq,
  });
});

// @desc    Create FAQ (Admin only)
// @route   POST /api/help/faqs
// @access  Private/Admin
export const createFAQHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const adminId = userDoc._id.toString();
  const faq = await createFAQ(adminId, req.body);

  res.status(201).json({
    success: true,
    faq,
  });
});

// @desc    Update FAQ (Admin only)
// @route   PUT /api/help/faqs/:id
// @access  Private/Admin
export const updateFAQ = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const adminId = userDoc._id.toString();
  const { id } = req.params;

  const faq = await FAQ.findByIdAndUpdate(
    id,
    { ...req.body, lastUpdatedBy: adminId },
    { new: true, runValidators: true }
  );

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found',
    });
  }

  res.json({
    success: true,
    faq,
  });
});

// @desc    Delete FAQ (Admin only)
// @route   DELETE /api/help/faqs/:id
// @access  Private/Admin
export const deleteFAQ = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const faq = await FAQ.findByIdAndDelete(id);

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found',
    });
  }

  res.json({
    success: true,
    message: 'FAQ deleted successfully',
  });
});

// @desc    Rate FAQ
// @route   POST /api/help/faqs/:id/rate
// @access  Private
export const rateFAQHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isHelpful } = req.body;

  if (typeof isHelpful !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isHelpful (boolean) is required',
    });
  }

  const faq = await rateFAQ(id, isHelpful);

  res.json({
    success: true,
    faq,
  });
});

// ========== Help Articles Endpoints ==========

// @desc    Get all help articles
// @route   GET /api/help/articles
// @access  Public
export const getHelpArticles = asyncHandler(async (req: Request, res: Response) => {
  const { category, status, search, featured } = req.query;

  const query: any = { status: 'published' };

  if (category) {
    query.category = category;
  }
  if (status) {
    query.status = status;
  }
  if (featured === 'true') {
    query.isFeatured = true;
  }
  if (search) {
    query.$text = { $search: search as string };
  }

  const articles = await HelpArticle.find(query)
    .sort({ category: 1, order: 1, publishedAt: -1 })
    .populate('author', 'username')
    .populate('lastUpdatedBy', 'username')
    .select(search ? { score: { $meta: 'textScore' } } : {});

  res.json({
    success: true,
    articles,
  });
});

// @desc    Get single help article
// @route   GET /api/help/articles/:slug
// @access  Public
export const getHelpArticle = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const article = await HelpArticle.findOne({ slug })
    .populate('author', 'username profilePhoto')
    .populate('lastUpdatedBy', 'username')
    .populate('relatedArticles', 'title slug')
    .populate('relatedFAQs', 'question category');

  if (!article || article.status !== 'published') {
    return res.status(404).json({
      success: false,
      message: 'Article not found',
    });
  }

  // Track view
  await trackArticleView(article._id.toString());

  res.json({
    success: true,
    article,
  });
});

// @desc    Create help article (Admin only)
// @route   POST /api/help/articles
// @access  Private/Admin
export const createHelpArticleHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const adminId = userDoc._id.toString();
  const article = await createHelpArticle(adminId, req.body);

  res.status(201).json({
    success: true,
    article,
  });
});

// @desc    Update help article (Admin only)
// @route   PUT /api/help/articles/:id
// @access  Private/Admin
export const updateHelpArticle = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const adminId = userDoc._id.toString();
  const { id } = req.params;

  const updateData: any = { ...req.body, lastUpdatedBy: adminId };
  
  // Set publishedAt if status changed to published
  if (req.body.status === 'published') {
    const article = await HelpArticle.findById(id);
    if (article && article.status !== 'published') {
      updateData.publishedAt = new Date();
    }
  }

  const article = await HelpArticle.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!article) {
    return res.status(404).json({
      success: false,
      message: 'Article not found',
    });
  }

  res.json({
    success: true,
    article,
  });
});

// @desc    Delete help article (Admin only)
// @route   DELETE /api/help/articles/:id
// @access  Private/Admin
export const deleteHelpArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const article = await HelpArticle.findByIdAndDelete(id);

  if (!article) {
    return res.status(404).json({
      success: false,
      message: 'Article not found',
    });
  }

  res.json({
    success: true,
    message: 'Article deleted successfully',
  });
});

// @desc    Rate article
// @route   POST /api/help/articles/:id/rate
// @access  Private
export const rateArticleHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isHelpful } = req.body;

  if (typeof isHelpful !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isHelpful (boolean) is required',
    });
  }

  const article = await rateArticle(id, isHelpful);

  res.json({
    success: true,
    article,
  });
});

// ========== Support Tickets Endpoints ==========

// @desc    Get user's support tickets
// @route   GET /api/help/tickets
// @access  Private
export const getUserTickets = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { status, category } = req.query;

  const query: any = { user: userId };

  if (status) {
    query.status = status;
  }
  if (category) {
    query.category = category;
  }

  const tickets = await SupportTicket.find(query)
    .sort({ createdAt: -1 })
    .populate('assignedTo', 'username profilePhoto')
    .populate('resolvedBy', 'username');

  res.json({
    success: true,
    tickets,
  });
});

// @desc    Get single support ticket
// @route   GET /api/help/tickets/:id
// @access  Private
export const getSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;
  const { default: User } = await import('../models/User');

  const ticket = await SupportTicket.findById(id)
    .populate('user', 'username email profilePhoto')
    .populate('assignedTo', 'username profilePhoto')
    .populate('resolvedBy', 'username')
    .populate('relatedCourse', 'title')
    .populate('relatedLesson', 'title');

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found',
    });
  }

  // Check access
  const user = await User.findById(userId);
  const isUser = ticket.user._id.toString() === userId;
  const isAdmin = user?.role === 'admin';
  const isAssigned = ticket.assignedTo && ticket.assignedTo._id.toString() === userId;

  if (!isUser && !isAdmin && !isAssigned) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // Filter internal messages for non-admins
  if (!isAdmin && !isAssigned) {
    ticket.messages = ticket.messages.filter((msg: any) => !msg.isInternal);
  }

  res.json({
    success: true,
    ticket,
  });
});

// @desc    Create support ticket
// @route   POST /api/help/tickets
// @access  Private
export const createSupportTicketHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const ticket = await createSupportTicket(userId, req.body);

  res.status(201).json({
    success: true,
    ticket,
    message: 'Support ticket created successfully',
  });
});

// @desc    Add message to ticket
// @route   POST /api/help/tickets/:id/messages
// @access  Private
export const addTicketMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;
  const { content, attachments, isInternal } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Message content is required',
    });
  }

  const ticket = await addTicketMessage(id, userId, content, attachments, isInternal || false);

  res.json({
    success: true,
    ticket,
    message: 'Message added successfully',
  });
});

// @desc    Update ticket status (Admin only)
// @route   PUT /api/help/tickets/:id/status
// @access  Private/Admin
export const updateTicketStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const adminId = userDoc._id.toString();
  const { id } = req.params;
  const { status, resolution } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required',
    });
  }

  const ticket = await updateTicketStatus(id, adminId, status, resolution);

  res.json({
    success: true,
    ticket,
  });
});

// @desc    Assign ticket (Admin only)
// @route   POST /api/help/tickets/:id/assign
// @access  Private/Admin
export const assignTicketHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const adminId = userDoc._id.toString();
  const { id } = req.params;
  const { assignedToId } = req.body;

  if (!assignedToId) {
    return res.status(400).json({
      success: false,
      message: 'assignedToId is required',
    });
  }

  const ticket = await assignTicket(id, adminId, assignedToId);

  res.json({
    success: true,
    ticket,
  });
});

// @desc    Get all tickets (Admin only)
// @route   GET /api/help/tickets/all
// @access  Private/Admin
export const getAllTickets = asyncHandler(async (req: Request, res: Response) => {
  const { status, category, priority, assignedTo } = req.query;

  const query: any = {};

  if (status) {
    query.status = status;
  }
  if (category) {
    query.category = category;
  }
  if (priority) {
    query.priority = priority;
  }
  if (assignedTo) {
    query.assignedTo = assignedTo;
  }

  const tickets = await SupportTicket.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('user', 'username email profilePhoto')
    .populate('assignedTo', 'username profilePhoto')
    .populate('resolvedBy', 'username');

  res.json({
    success: true,
    tickets,
  });
});

// ========== Video Tutorials Endpoints ==========

// @desc    Get all video tutorials
// @route   GET /api/help/tutorials
// @access  Public
export const getVideoTutorials = asyncHandler(async (req: Request, res: Response) => {
  const { category, featured, search } = req.query;

  const query: any = { isPublished: true };

  if (category) {
    query.category = category;
  }
  if (featured === 'true') {
    query.isFeatured = true;
  }
  if (search) {
    query.$text = { $search: search as string };
  }

  const tutorials = await VideoTutorial.find(query)
    .sort({ category: 1, order: 1, createdAt: -1 })
    .select(search ? { score: { $meta: 'textScore' } } : {});

  res.json({
    success: true,
    tutorials,
  });
});

// @desc    Get single video tutorial
// @route   GET /api/help/tutorials/:id
// @access  Public
export const getVideoTutorial = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tutorial = await VideoTutorial.findById(id)
    .populate('relatedArticles', 'title slug')
    .populate('relatedFAQs', 'question category');

  if (!tutorial || !tutorial.isPublished) {
    return res.status(404).json({
      success: false,
      message: 'Tutorial not found',
    });
  }

  // Track view
  await trackTutorialView(id);

  res.json({
    success: true,
    tutorial,
  });
});

// @desc    Create video tutorial (Admin only)
// @route   POST /api/help/tutorials
// @access  Private/Admin
export const createVideoTutorialHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const adminId = userDoc._id.toString();
  const tutorial = await createVideoTutorial(adminId, req.body);

  res.status(201).json({
    success: true,
    tutorial,
  });
});

// @desc    Update video tutorial (Admin only)
// @route   PUT /api/help/tutorials/:id
// @access  Private/Admin
export const updateVideoTutorial = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tutorial = await VideoTutorial.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!tutorial) {
    return res.status(404).json({
      success: false,
      message: 'Tutorial not found',
    });
  }

  res.json({
    success: true,
    tutorial,
  });
});

// @desc    Delete video tutorial (Admin only)
// @route   DELETE /api/help/tutorials/:id
// @access  Private/Admin
export const deleteVideoTutorial = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tutorial = await VideoTutorial.findByIdAndDelete(id);

  if (!tutorial) {
    return res.status(404).json({
      success: false,
      message: 'Tutorial not found',
    });
  }

  res.json({
    success: true,
    message: 'Tutorial deleted successfully',
  });
});

// @desc    Rate tutorial
// @route   POST /api/help/tutorials/:id/rate
// @access  Private
export const rateTutorialHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isHelpful } = req.body;

  if (typeof isHelpful !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isHelpful (boolean) is required',
    });
  }

  const tutorial = await rateTutorial(id, isHelpful);

  res.json({
    success: true,
    tutorial,
  });
});


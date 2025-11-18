import FAQ from '../models/FAQ';
import HelpArticle from '../models/HelpArticle';
import SupportTicket from '../models/SupportTicket';
import VideoTutorial from '../models/VideoTutorial';
import { createNotification } from './notificationService';
import { sendEmail } from './email/emailService';
import logger from '../utils/logger';

/**
 * Create FAQ
 */
export const createFAQ = async (
  adminId: string,
  data: {
    question: string;
    answer: string;
    category: 'general' | 'account' | 'courses' | 'payments' | 'technical' | 'features' | 'other';
    tags?: string[];
    order?: number;
    isPublished?: boolean;
    isFeatured?: boolean;
  }
): Promise<any> => {
  try {
    const faq = await FAQ.create({
      question: data.question,
      answer: data.answer,
      category: data.category,
      tags: data.tags,
      order: data.order || 0,
      isPublished: data.isPublished || false,
      isFeatured: data.isFeatured || false,
      lastUpdatedBy: adminId,
    });

    logger.info(`FAQ created: ${faq._id} by admin ${adminId}`);
    return faq;
  } catch (error) {
    logger.error('Error creating FAQ:', error);
    throw error;
  }
};

/**
 * Track FAQ view
 */
export const trackFAQView = async (faqId: string): Promise<void> => {
  try {
    await FAQ.findByIdAndUpdate(faqId, {
      $inc: { viewCount: 1 },
    });
  } catch (error) {
    logger.error('Error tracking FAQ view:', error);
  }
};

/**
 * Mark FAQ as helpful/not helpful
 */
export const rateFAQ = async (
  faqId: string,
  isHelpful: boolean
): Promise<any> => {
  try {
    const faq = await FAQ.findById(faqId);
    if (!faq) {
      throw new Error('FAQ not found');
    }

    if (isHelpful) {
      faq.helpfulCount += 1;
    } else {
      faq.notHelpfulCount += 1;
    }

    await faq.save();
    return faq;
  } catch (error) {
    logger.error('Error rating FAQ:', error);
    throw error;
  }
};

/**
 * Create help article
 */
export const createHelpArticle = async (
  adminId: string,
  data: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    category: 'getting-started' | 'account-settings' | 'courses' | 'payments' | 'features' | 'troubleshooting' | 'api' | 'other';
    thumbnail?: string;
    videoUrl?: string;
    tags?: string[];
    order?: number;
    status?: 'draft' | 'published' | 'archived';
    relatedArticles?: string[];
    relatedFAQs?: string[];
    metaTitle?: string;
    metaDescription?: string;
  }
): Promise<any> => {
  try {
    const article = await HelpArticle.create({
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      category: data.category,
      thumbnail: data.thumbnail,
      videoUrl: data.videoUrl,
      tags: data.tags,
      order: data.order || 0,
      status: data.status || 'draft',
      author: adminId,
      lastUpdatedBy: adminId,
      relatedArticles: data.relatedArticles,
      relatedFAQs: data.relatedFAQs,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      publishedAt: data.status === 'published' ? new Date() : undefined,
    });

    logger.info(`Help article created: ${article._id} by admin ${adminId}`);
    return article;
  } catch (error) {
    logger.error('Error creating help article:', error);
    throw error;
  }
};

/**
 * Track article view
 */
export const trackArticleView = async (articleId: string): Promise<void> => {
  try {
    await HelpArticle.findByIdAndUpdate(articleId, {
      $inc: { viewCount: 1 },
    });
  } catch (error) {
    logger.error('Error tracking article view:', error);
  }
};

/**
 * Rate article helpfulness
 */
export const rateArticle = async (
  articleId: string,
  isHelpful: boolean
): Promise<any> => {
  try {
    const article = await HelpArticle.findById(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    if (isHelpful) {
      article.helpfulCount += 1;
    } else {
      article.notHelpfulCount += 1;
    }

    await article.save();
    return article;
  } catch (error) {
    logger.error('Error rating article:', error);
    throw error;
  }
};

/**
 * Create support ticket
 */
export const createSupportTicket = async (
  userId: string,
  data: {
    subject: string;
    description: string;
    category: 'account' | 'billing' | 'technical' | 'course' | 'feature_request' | 'bug_report' | 'other';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
    relatedCourseId?: string;
    relatedLessonId?: string;
  }
): Promise<any> => {
  try {
    const ticket = await SupportTicket.create({
      user: userId,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority || 'normal',
      attachments: data.attachments,
      relatedCourse: data.relatedCourseId,
      relatedLesson: data.relatedLessonId,
      messages: [{
        sender: userId,
        content: data.description,
        attachments: data.attachments,
        isInternal: false,
        createdAt: new Date(),
      }],
    });

    // Send notification to admins
    const { default: User } = await import('../models/User');
    const admins = await User.find({ role: 'admin' }).select('_id');
    
    for (const admin of admins) {
      await createNotification(admin._id.toString(), 'support_ticket_created', {
        title: 'New Support Ticket',
        message: `New ticket: ${data.subject}`,
        actionUrl: `/admin/support/tickets/${ticket._id}`,
        priority: data.priority === 'urgent' ? 'urgent' : 'high',
        sendEmail: true,
      }).catch((error) => {
        logger.error('Error sending ticket notification:', error);
      });
    }

    // Send confirmation to user
    const user = await User.findById(userId);
    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: `Support Ticket Created: ${data.subject}`,
        html: `
          <h2>Your support ticket has been created</h2>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Priority:</strong> ${data.priority || 'normal'}</p>
          <p>We'll get back to you as soon as possible. You can track your ticket status in your account.</p>
        `,
      }).catch((error) => {
        logger.error('Error sending ticket confirmation email:', error);
      });
    }

    logger.info(`Support ticket created: ${ticket._id} by user ${userId}`);
    return ticket;
  } catch (error) {
    logger.error('Error creating support ticket:', error);
    throw error;
  }
};

/**
 * Add message to support ticket
 */
export const addTicketMessage = async (
  ticketId: string,
  userId: string,
  content: string,
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>,
  isInternal: boolean = false
): Promise<any> => {
  try {
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Check access
    const isUser = ticket.user.toString() === userId;
    const isAssigned = ticket.assignedTo?.toString() === userId;
    const { default: User } = await import('../models/User');
    const user = await User.findById(userId);
    const isAdmin = user?.role === 'admin';

    if (!isUser && !isAssigned && !isAdmin) {
      throw new Error('Access denied');
    }

    // Add message
    ticket.messages.push({
      sender: userId as any,
      content,
      attachments,
      isInternal,
      createdAt: new Date(),
    });

    ticket.messageCount += 1;

    // Update status
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticket.status = 'open';
    } else if (isUser && ticket.status === 'in_progress') {
      ticket.status = 'waiting_user';
    } else if ((isAdmin || isAssigned) && ticket.status === 'waiting_user') {
      ticket.status = 'in_progress';
    }

    // Calculate first response time
    if (!ticket.firstResponseTime && (isAdmin || isAssigned)) {
      const firstResponse = Math.floor(
        (new Date().getTime() - ticket.createdAt.getTime()) / (1000 * 60)
      );
      ticket.firstResponseTime = firstResponse;
    }

    await ticket.save();

    // Send notifications
    if (isUser) {
      // Notify assigned admin
      if (ticket.assignedTo) {
        await createNotification(ticket.assignedTo.toString(), 'ticket_message', {
          title: 'New Message on Support Ticket',
          message: `New message on ticket: ${ticket.subject}`,
          actionUrl: `/admin/support/tickets/${ticketId}`,
          sendEmail: true,
        }).catch((error) => {
          logger.error('Error sending ticket message notification:', error);
        });
      }
    } else {
      // Notify user
      await createNotification(ticket.user.toString(), 'ticket_message', {
        title: 'Response to Your Support Ticket',
        message: `You have a new response on: ${ticket.subject}`,
        actionUrl: `/support/tickets/${ticketId}`,
        sendEmail: true,
      }).catch((error) => {
        logger.error('Error sending ticket message notification:', error);
      });
    }

    logger.info(`Message added to ticket ${ticketId} by ${userId}`);
    return ticket;
  } catch (error) {
    logger.error('Error adding ticket message:', error);
    throw error;
  }
};

/**
 * Update ticket status
 */
export const updateTicketStatus = async (
  ticketId: string,
  adminId: string,
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed',
  resolution?: string
): Promise<any> => {
  try {
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.status = status;
    ticket.assignedTo = ticket.assignedTo || adminId;

    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
      ticket.resolvedBy = adminId;
      ticket.resolution = resolution;

      // Calculate resolution time
      ticket.resolutionTime = Math.floor(
        (new Date().getTime() - ticket.createdAt.getTime()) / (1000 * 60)
      );

      // Notify user
      await createNotification(ticket.user.toString(), 'ticket_resolved', {
        title: 'Support Ticket Resolved',
        message: `Your ticket "${ticket.subject}" has been resolved`,
        actionUrl: `/support/tickets/${ticketId}`,
        sendEmail: true,
      }).catch((error) => {
        logger.error('Error sending ticket resolution notification:', error);
      });
    }

    await ticket.save();
    return ticket;
  } catch (error) {
    logger.error('Error updating ticket status:', error);
    throw error;
  }
};

/**
 * Assign ticket
 */
export const assignTicket = async (
  ticketId: string,
  adminId: string,
  assignedToId: string
): Promise<any> => {
  try {
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.assignedTo = assignedToId as any;
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    // Notify assigned admin
    await createNotification(assignedToId, 'ticket_assigned', {
      title: 'Support Ticket Assigned',
      message: `You've been assigned to ticket: ${ticket.subject}`,
      actionUrl: `/admin/support/tickets/${ticketId}`,
      sendEmail: true,
    }).catch((error) => {
      logger.error('Error sending assignment notification:', error);
    });

    return ticket;
  } catch (error) {
    logger.error('Error assigning ticket:', error);
    throw error;
  }
};

/**
 * Create video tutorial
 */
export const createVideoTutorial = async (
  adminId: string,
  data: {
    title: string;
    description?: string;
    videoUrl: string;
    videoId?: string;
    thumbnail?: string;
    duration?: number;
    category: 'getting-started' | 'features' | 'courses' | 'account' | 'advanced' | 'other';
    tags?: string[];
    order?: number;
    isPublished?: boolean;
    isFeatured?: boolean;
    relatedArticles?: string[];
    relatedFAQs?: string[];
  }
): Promise<any> => {
  try {
    const tutorial = await VideoTutorial.create({
      title: data.title,
      description: data.description,
      videoUrl: data.videoUrl,
      videoId: data.videoId,
      thumbnail: data.thumbnail,
      duration: data.duration,
      category: data.category,
      tags: data.tags,
      order: data.order || 0,
      isPublished: data.isPublished || false,
      isFeatured: data.isFeatured || false,
      relatedArticles: data.relatedArticles,
      relatedFAQs: data.relatedFAQs,
    });

    logger.info(`Video tutorial created: ${tutorial._id} by admin ${adminId}`);
    return tutorial;
  } catch (error) {
    logger.error('Error creating video tutorial:', error);
    throw error;
  }
};

/**
 * Track tutorial view
 */
export const trackTutorialView = async (tutorialId: string): Promise<void> => {
  try {
    await VideoTutorial.findByIdAndUpdate(tutorialId, {
      $inc: { viewCount: 1 },
    });
  } catch (error) {
    logger.error('Error tracking tutorial view:', error);
  }
};

/**
 * Rate tutorial helpfulness
 */
export const rateTutorial = async (
  tutorialId: string,
  isHelpful: boolean
): Promise<any> => {
  try {
    const tutorial = await VideoTutorial.findById(tutorialId);
    if (!tutorial) {
      throw new Error('Tutorial not found');
    }

    if (isHelpful) {
      tutorial.helpfulCount += 1;
    } else {
      tutorial.notHelpfulCount += 1;
    }

    await tutorial.save();
    return tutorial;
  } catch (error) {
    logger.error('Error rating tutorial:', error);
    throw error;
  }
};


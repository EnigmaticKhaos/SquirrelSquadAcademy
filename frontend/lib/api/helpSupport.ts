import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

// Types
export type FAQCategory = 'general' | 'account' | 'courses' | 'payments' | 'technical' | 'features' | 'other';
export type HelpArticleCategory = 'getting-started' | 'account-settings' | 'courses' | 'payments' | 'features' | 'troubleshooting' | 'api' | 'other';
export type HelpArticleStatus = 'draft' | 'published' | 'archived';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory = 'account' | 'billing' | 'technical' | 'course' | 'feature_request' | 'bug_report' | 'other';

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  tags?: string[];
  order: number;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  lastUpdatedBy?: {
    _id: string;
    username: string;
  };
  relatedArticles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HelpArticle {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: HelpArticleCategory;
  status: HelpArticleStatus;
  thumbnail?: string;
  videoUrl?: string;
  tags?: string[];
  order: number;
  author: {
    _id: string;
    username: string;
    profilePhoto?: string;
  };
  lastUpdatedBy?: {
    _id: string;
    username: string;
  };
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedArticles?: Array<{ _id: string; title: string; slug: string }>;
  relatedFAQs?: Array<{ _id: string; question: string; category: FAQCategory }>;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  assignedTo?: {
    _id: string;
    username: string;
    profilePhoto?: string;
  };
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  relatedCourse?: {
    _id: string;
    title: string;
  };
  relatedLesson?: {
    _id: string;
    title: string;
  };
  messages: Array<{
    _id?: string;
    sender: {
      _id: string;
      username: string;
      profilePhoto?: string;
    };
    content: string;
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
    isInternal: boolean;
    createdAt: string;
  }>;
  resolvedAt?: string;
  resolvedBy?: {
    _id: string;
    username: string;
  };
  resolution?: string;
  userRating?: number;
  userFeedback?: string;
  firstResponseTime?: number;
  resolutionTime?: number;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoTutorial {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  category: HelpArticleCategory;
  duration?: number;
  tags?: string[];
  order: number;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  author: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

// API Client
export const helpSupportApi = {
  // FAQs
  getFAQs: (params?: {
    category?: FAQCategory;
    featured?: boolean;
    search?: string;
  }) => api.get<ApiResponse<{ faqs: FAQ[] }>>('/help/faqs', { params }),
  
  getFAQ: (id: string) => api.get<ApiResponse<{ faq: FAQ }>>(`/help/faqs/${id}`),
  
  rateFAQ: (id: string, isHelpful: boolean) =>
    api.post<ApiResponse<{ faq: FAQ }>>(`/help/faqs/${id}/rate`, { isHelpful }),

  // Help Articles
  getHelpArticles: (params?: {
    category?: HelpArticleCategory;
    status?: HelpArticleStatus;
    search?: string;
    featured?: boolean;
  }) => api.get<ApiResponse<{ articles: HelpArticle[] }>>('/help/articles', { params }),
  
  getHelpArticle: (slug: string) => api.get<ApiResponse<{ article: HelpArticle }>>(`/help/articles/${slug}`),
  
  rateArticle: (id: string, isHelpful: boolean) =>
    api.post<ApiResponse<{ article: HelpArticle }>>(`/help/articles/${id}/rate`, { isHelpful }),

  // Support Tickets
  getTickets: (params?: {
    status?: TicketStatus;
    category?: TicketCategory;
  }) => api.get<ApiResponse<{ tickets: SupportTicket[] }>>('/help/tickets', { params }),
  
  getTicket: (id: string) => api.get<ApiResponse<{ ticket: SupportTicket }>>(`/help/tickets/${id}`),
  
  createTicket: (data: {
    subject: string;
    description: string;
    category: TicketCategory;
    priority?: TicketPriority;
    relatedCourse?: string;
    relatedLesson?: string;
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  }) => api.post<ApiResponse<{ ticket: SupportTicket }>>('/help/tickets', data),
  
  addTicketMessage: (id: string, data: {
    content: string;
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
  }) => api.post<ApiResponse<{ ticket: SupportTicket }>>(`/help/tickets/${id}/messages`, data),

  // Video Tutorials
  getVideoTutorials: (params?: {
    category?: HelpArticleCategory;
    featured?: boolean;
    search?: string;
  }) => api.get<ApiResponse<{ tutorials: VideoTutorial[] }>>('/help/tutorials', { params }),
  
  getVideoTutorial: (id: string) => api.get<ApiResponse<{ tutorial: VideoTutorial }>>(`/help/tutorials/${id}`),
  
  rateTutorial: (id: string, isHelpful: boolean) =>
    api.post<ApiResponse<{ tutorial: VideoTutorial }>>(`/help/tutorials/${id}/rate`, { isHelpful }),
};


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { helpSupportApi, type FAQ, type HelpArticle, type SupportTicket, type VideoTutorial, type FAQCategory, type HelpArticleCategory, type HelpArticleStatus, type TicketStatus, type TicketCategory, type TicketPriority } from '@/lib/api/helpSupport';
import { showToast, getErrorMessage } from '@/lib/toast';

// FAQs
export const useFAQs = (params?: { category?: FAQCategory; featured?: boolean; search?: string }) => {
  return useQuery<FAQ[]>({
    queryKey: ['faqs', params],
    queryFn: async () => {
      const response = await helpSupportApi.getFAQs(params);
      // Backend returns { success: true, faqs: [...] }
      // Handle both ApiResponse wrapper and direct response
      const data = response.data.data || response.data;
      return data?.faqs || [];
    },
    placeholderData: [],
  });
};

export const useFAQ = (id: string, enabled = true) => {
  return useQuery<FAQ>({
    queryKey: ['faq', id],
    queryFn: async () => {
      const response = await helpSupportApi.getFAQ(id);
      // Backend returns { success: true, faq: {...} }
      const data = response.data.data || response.data;
      return data?.faq;
    },
    enabled: enabled && !!id,
  });
};

export const useRateFAQ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isHelpful }: { id: string; isHelpful: boolean }) =>
      helpSupportApi.rateFAQ(id, isHelpful),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['faq', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      showToast.success(variables.isHelpful ? 'Thank you for your feedback!' : 'Thanks for letting us know');
    },
    onError: (error) => {
      showToast.error('Failed to submit feedback', getErrorMessage(error));
    },
  });
};

// Help Articles
export const useHelpArticles = (params?: { category?: HelpArticleCategory; status?: HelpArticleStatus; search?: string; featured?: boolean }) => {
  return useQuery<HelpArticle[]>({
    queryKey: ['help-articles', params],
    queryFn: async () => {
      const response = await helpSupportApi.getHelpArticles(params);
      // Backend returns { success: true, articles: [...] }
      const data = response.data.data || response.data;
      return data?.articles || [];
    },
    placeholderData: [],
  });
};

export const useHelpArticle = (slug: string, enabled = true) => {
  return useQuery<HelpArticle>({
    queryKey: ['help-article', slug],
    queryFn: async () => {
      const response = await helpSupportApi.getHelpArticle(slug);
      // Backend returns { success: true, article: {...} }
      const data = response.data.data || response.data;
      return data?.article;
    },
    enabled: enabled && !!slug,
  });
};

export const useRateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isHelpful }: { id: string; isHelpful: boolean }) =>
      helpSupportApi.rateArticle(id, isHelpful),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['help-article'] });
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
      showToast.success(variables.isHelpful ? 'Thank you for your feedback!' : 'Thanks for letting us know');
    },
    onError: (error) => {
      showToast.error('Failed to submit feedback', getErrorMessage(error));
    },
  });
};

// Support Tickets
export const useSupportTickets = (params?: { status?: TicketStatus; category?: TicketCategory }) => {
  return useQuery<SupportTicket[]>({
    queryKey: ['support-tickets', params],
    queryFn: async () => {
      const response = await helpSupportApi.getTickets(params);
      // Backend returns { success: true, tickets: [...] }
      const data = response.data.data || response.data;
      return data?.tickets || [];
    },
    placeholderData: [],
  });
};

export const useSupportTicket = (id: string, enabled = true) => {
  return useQuery<SupportTicket>({
    queryKey: ['support-ticket', id],
    queryFn: async () => {
      const response = await helpSupportApi.getTicket(id);
      // Backend returns { success: true, ticket: {...} }
      const data = response.data.data || response.data;
      return data?.ticket;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      subject: string;
      description: string;
      category: TicketCategory;
      priority?: TicketPriority;
      relatedCourse?: string;
      relatedLesson?: string;
      attachments?: Array<{ name: string; url: string; type: string; size: number }>;
    }) => helpSupportApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      showToast.success('Support ticket created', 'We will get back to you soon!');
    },
    onError: (error) => {
      showToast.error('Failed to create support ticket', getErrorMessage(error));
    },
  });
};

export const useAddTicketMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content, attachments }: { id: string; content: string; attachments?: Array<{ name: string; url: string; type: string }> }) =>
      helpSupportApi.addTicketMessage(id, { content, attachments }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      showToast.success('Message sent');
    },
    onError: (error) => {
      showToast.error('Failed to send message', getErrorMessage(error));
    },
  });
};

// Video Tutorials
export const useVideoTutorials = (params?: { category?: HelpArticleCategory; featured?: boolean; search?: string }) => {
  return useQuery<VideoTutorial[]>({
    queryKey: ['video-tutorials', params],
    queryFn: async () => {
      const response = await helpSupportApi.getVideoTutorials(params);
      // Backend returns { success: true, tutorials: [...] }
      const data = response.data.data || response.data;
      return data?.tutorials || [];
    },
    placeholderData: [],
  });
};

export const useVideoTutorial = (id: string, enabled = true) => {
  return useQuery<VideoTutorial>({
    queryKey: ['video-tutorial', id],
    queryFn: async () => {
      const response = await helpSupportApi.getVideoTutorial(id);
      // Backend returns { success: true, tutorial: {...} }
      const data = response.data.data || response.data;
      return data?.tutorial;
    },
    enabled: enabled && !!id,
  });
};

export const useRateTutorial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isHelpful }: { id: string; isHelpful: boolean }) =>
      helpSupportApi.rateTutorial(id, isHelpful),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['video-tutorial', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['video-tutorials'] });
      showToast.success(variables.isHelpful ? 'Thank you for your feedback!' : 'Thanks for letting us know');
    },
    onError: (error) => {
      showToast.error('Failed to submit feedback', getErrorMessage(error));
    },
  });
};


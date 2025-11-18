import express from 'express';
import { protect, admin } from '../middleware/auth';
import {
  // FAQs
  getFAQs,
  getFAQ,
  createFAQHandler,
  updateFAQ,
  deleteFAQ,
  rateFAQHandler,
  // Help Articles
  getHelpArticles,
  getHelpArticle,
  createHelpArticleHandler,
  updateHelpArticle,
  deleteHelpArticle,
  rateArticleHandler,
  // Support Tickets
  getUserTickets,
  getSupportTicket,
  createSupportTicketHandler,
  addTicketMessageHandler,
  updateTicketStatusHandler,
  assignTicketHandler,
  getAllTickets,
  // Video Tutorials
  getVideoTutorials,
  getVideoTutorial,
  createVideoTutorialHandler,
  updateVideoTutorial,
  deleteVideoTutorial,
  rateTutorialHandler,
} from '../controllers/helpSupportController';

const router = express.Router();

// ========== FAQ Routes ==========
router.get('/faqs', getFAQs);
router.get('/faqs/:id', getFAQ);
router.post('/faqs/:id/rate', protect, rateFAQHandler);

// Admin routes
router.post('/faqs', protect, admin, createFAQHandler);
router.put('/faqs/:id', protect, admin, updateFAQ);
router.delete('/faqs/:id', protect, admin, deleteFAQ);

// ========== Help Articles Routes ==========
router.get('/articles', getHelpArticles);
router.get('/articles/:slug', getHelpArticle);
router.post('/articles/:id/rate', protect, rateArticleHandler);

// Admin routes
router.post('/articles', protect, admin, createHelpArticleHandler);
router.put('/articles/:id', protect, admin, updateHelpArticle);
router.delete('/articles/:id', protect, admin, deleteHelpArticle);

// ========== Support Tickets Routes ==========
router.get('/tickets', protect, getUserTickets);
router.get('/tickets/:id', protect, getSupportTicket);
router.post('/tickets', protect, createSupportTicketHandler);
router.post('/tickets/:id/messages', protect, addTicketMessageHandler);

// Admin routes
router.get('/tickets/all', protect, admin, getAllTickets);
router.put('/tickets/:id/status', protect, admin, updateTicketStatusHandler);
router.post('/tickets/:id/assign', protect, admin, assignTicketHandler);

// ========== Video Tutorials Routes ==========
router.get('/tutorials', getVideoTutorials);
router.get('/tutorials/:id', getVideoTutorial);
router.post('/tutorials/:id/rate', protect, rateTutorialHandler);

// Admin routes
router.post('/tutorials', protect, admin, createVideoTutorialHandler);
router.put('/tutorials/:id', protect, admin, updateVideoTutorial);
router.delete('/tutorials/:id', protect, admin, deleteVideoTutorial);

export default router;


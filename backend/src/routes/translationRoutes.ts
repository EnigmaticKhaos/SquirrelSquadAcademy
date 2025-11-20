import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getLanguages,
  getDefaultLanguageHandler,
  translateContentHandler,
  getTranslationHandler,
  getContentTranslationsHandler,
  createTranslationHandler,
  reviewTranslationHandler,
  publishTranslation,
  getTranslationStatistics,
  initializeLanguages,
} from '../controllers/translationController';

const router = express.Router();

// Public routes
router.get('/languages', getLanguages);
router.get('/default-language', getDefaultLanguageHandler);
router.get('/translations/:contentType/:contentId/:language', getTranslationHandler);

// Protected routes
router.get('/translations/:contentType/:contentId', protect, getContentTranslationsHandler);

// Admin routes
router.post('/translate', protect, authorize('admin'), translateContentHandler);
router.post('/translations', protect, authorize('admin'), createTranslationHandler);
router.post('/translations/:id/review', protect, authorize('admin'), reviewTranslationHandler);
router.post('/translations/:id/publish', protect, authorize('admin'), publishTranslation);
router.get('/statistics', protect, authorize('admin'), getTranslationStatistics);
router.post('/initialize-languages', protect, authorize('admin'), initializeLanguages);

export default router;


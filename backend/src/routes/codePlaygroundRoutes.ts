import express from 'express';
import {
  saveSnippet,
  updateSnippet,
  deleteSnippet,
  getMySnippets,
  getPublicSnippetsHandler,
  getSnippet,
  executeSnippet,
  executeQuick,
  validateCodeHandler,
} from '../controllers/codePlaygroundController';
import { protect } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public routes
router.get('/snippets/public', getPublicSnippetsHandler);
router.get('/snippets/:id', getSnippet); // Can be public or private depending on snippet

// Private routes
router.use(protect);

router.post('/snippets', saveSnippet);
router.put('/snippets/:id', updateSnippet);
router.delete('/snippets/:id', deleteSnippet);
router.get('/snippets', getMySnippets);
router.post('/snippets/:id/execute', aiLimiter, executeSnippet);
router.post('/execute', aiLimiter, executeQuick);
router.post('/validate', aiLimiter, validateCodeHandler);

export default router;


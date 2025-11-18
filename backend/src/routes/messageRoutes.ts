import express from 'express';
import { protect } from '../middleware/auth';
import { canMessageUser } from '../middleware/privacyEnforcement';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
} from '../controllers/messageController';

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/conversations', getConversations);
router.get('/conversations/:userId', canMessageUser, getOrCreateConversation);
router.post('/conversations', canMessageUser, getOrCreateConversation);
router.get('/conversations/:id/messages', getMessages);

export default router;


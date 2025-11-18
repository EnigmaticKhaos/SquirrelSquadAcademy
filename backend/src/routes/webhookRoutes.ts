import express from 'express';
import { protect } from '../middleware/auth';
import {
  createWebhookHandler,
  getUserWebhooksHandler,
  updateWebhookHandler,
  deleteWebhookHandler,
} from '../controllers/webhookController';

const router = express.Router();

router.use(protect);

router.post('/', createWebhookHandler);
router.get('/', getUserWebhooksHandler);
router.put('/:id', updateWebhookHandler);
router.delete('/:id', deleteWebhookHandler);

export default router;


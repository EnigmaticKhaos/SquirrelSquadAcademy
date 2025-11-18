import express from 'express';
import { protect } from '../middleware/auth';
import {
  createCheckout,
  webhook,
  getSubscription,
  cancelSubscription,
} from '../controllers/stripeController';

const router = express.Router();

// Webhook must be before body parser middleware
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

router.post('/create-checkout-session', protect, createCheckout);
router.get('/subscription', protect, getSubscription);
router.post('/cancel-subscription', protect, cancelSubscription);

export default router;


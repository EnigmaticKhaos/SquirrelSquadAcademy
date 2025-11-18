import express from 'express';
import { protect } from '../middleware/auth';
import {
  getVapidPublicKeyHandler,
  subscribeToPushHandler,
  unsubscribeFromPushHandler,
  getUserPushSubscriptionsHandler,
  testPushNotification,
  queueOfflineActionHandler,
  syncOfflineActionsHandler,
  getPendingSyncActionsHandler,
  resolveSyncConflictHandler,
  clearSyncedActionsHandler,
} from '../controllers/pwaController';

const router = express.Router();

// VAPID public key (public)
router.get('/vapid-public-key', getVapidPublicKeyHandler);

// Push notification routes (protected)
router.post('/push/subscribe', protect, subscribeToPushHandler);
router.post('/push/unsubscribe', protect, unsubscribeFromPushHandler);
router.get('/push/subscriptions', protect, getUserPushSubscriptionsHandler);
router.post('/push/test', protect, testPushNotification);

// Offline sync routes (protected)
router.post('/sync/queue', protect, queueOfflineActionHandler);
router.post('/sync', protect, syncOfflineActionsHandler);
router.get('/sync/pending', protect, getPendingSyncActionsHandler);
router.post('/sync/conflict/:id/resolve', protect, resolveSyncConflictHandler);
router.delete('/sync/cleared', protect, clearSyncedActionsHandler);

export default router;


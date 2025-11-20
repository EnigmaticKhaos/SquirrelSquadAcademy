import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { IUser } from '../models/User';
import {
  subscribeToPush,
  unsubscribeFromPush,
  getUserPushSubscriptions,
  sendPushNotification,
  getVapidPublicKey,
} from '../services/pushNotificationService';
import {
  queueOfflineAction,
  syncOfflineActions,
  getPendingSyncActions,
  resolveSyncConflict,
  clearSyncedActions,
} from '../services/offlineSyncService';

// @desc    Get VAPID public key
// @route   GET /api/pwa/vapid-public-key
// @access  Public
export const getVapidPublicKeyHandler = asyncHandler(async (req: Request, res: Response) => {
  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return res.status(503).json({
      success: false,
      message: 'Push notifications are not configured',
    });
  }

  res.json({
    success: true,
    publicKey,
  });
});

// @desc    Subscribe to push notifications
// @route   POST /api/pwa/push/subscribe
// @access  Private
export const subscribeToPushHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { subscription, userAgent, deviceType, browser, os } = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({
      success: false,
      message: 'Subscription object with endpoint and keys is required',
    });
  }

  const pushSub = await subscribeToPush(userId, {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    userAgent,
    deviceType,
    browser,
    os,
  });

  res.status(201).json({
    success: true,
    subscription: pushSub,
    message: 'Successfully subscribed to push notifications',
  });
});

// @desc    Unsubscribe from push notifications
// @route   POST /api/pwa/push/unsubscribe
// @access  Private
export const unsubscribeFromPushHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({
      success: false,
      message: 'Endpoint is required',
    });
  }

  await unsubscribeFromPush(userId, endpoint);

  res.json({
    success: true,
    message: 'Successfully unsubscribed from push notifications',
  });
});

// @desc    Get user's push subscriptions
// @route   GET /api/pwa/push/subscriptions
// @access  Private
export const getUserPushSubscriptionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const subscriptions = await getUserPushSubscriptions(userId);

  res.json({
    success: true,
    subscriptions,
  });
});

// @desc    Test push notification (for testing)
// @route   POST /api/pwa/push/test
// @access  Private
export const testPushNotification = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { title, body, icon, badge, data } = req.body;

  const result = await sendPushNotification(userId, {
    title: title || 'Test Notification',
    body: body || 'This is a test push notification',
    icon,
    badge,
    data,
  });

  res.json({
    success: true,
    result,
    message: `Push notification sent: ${result.sent} sent, ${result.failed} failed`,
  });
});

// @desc    Queue offline action
// @route   POST /api/pwa/sync/queue
// @access  Private
export const queueOfflineActionHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { actionType, actionData } = req.body;

  if (!actionType || !actionData) {
    return res.status(400).json({
      success: false,
      message: 'actionType and actionData are required',
    });
  }

  const queueItem = await queueOfflineAction(userId, actionType, actionData);

  res.status(201).json({
    success: true,
    queueItem,
    message: 'Action queued for sync',
  });
});

// @desc    Sync offline actions
// @route   POST /api/pwa/sync
// @access  Private
export const syncOfflineActionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const result = await syncOfflineActions(userId);

  res.json({
    success: true,
    result,
    message: `Sync completed: ${result.synced} synced, ${result.failed} failed, ${result.conflicts} conflicts`,
  });
});

// @desc    Get pending sync actions
// @route   GET /api/pwa/sync/pending
// @access  Private
export const getPendingSyncActionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const actions = await getPendingSyncActions(userId);

  res.json({
    success: true,
    actions,
  });
});

// @desc    Resolve sync conflict
// @route   POST /api/pwa/sync/conflict/:id/resolve
// @access  Private
export const resolveSyncConflictHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;
  const { resolution, clientData } = req.body;

  if (!resolution || !['server', 'client', 'merge'].includes(resolution)) {
    return res.status(400).json({
      success: false,
      message: 'resolution must be one of: server, client, merge',
    });
  }

  const action = await resolveSyncConflict(id, resolution, clientData);

  res.json({
    success: true,
    action,
    message: 'Conflict resolved successfully',
  });
});

// @desc    Clear synced actions
// @route   DELETE /api/pwa/sync/cleared
// @access  Private
export const clearSyncedActionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { olderThanDays } = req.query;

  const days = olderThanDays ? parseInt(olderThanDays as string, 10) : 7;

  const deletedCount = await clearSyncedActions(userId, days);

  res.json({
    success: true,
    deletedCount,
    message: `Cleared ${deletedCount} synced actions`,
  });
});


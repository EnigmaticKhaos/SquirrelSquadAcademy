import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription';
import { createNotification } from './notificationService';
import logger from '../utils/logger';

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@squirrelsquadacademy.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Subscribe user to push notifications
 */
export const subscribeToPush = async (
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
    userAgent?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    os?: string;
  }
): Promise<any> => {
  try {
    // Check if subscription already exists
    let pushSub = await PushSubscription.findOne({ endpoint: subscription.endpoint });

    if (pushSub) {
      // Update existing subscription
      pushSub.user = userId as any;
      pushSub.keys = subscription.keys;
      pushSub.userAgent = subscription.userAgent;
      pushSub.deviceType = subscription.deviceType;
      pushSub.browser = subscription.browser;
      pushSub.os = subscription.os;
      pushSub.isActive = true;
      pushSub.lastUsed = new Date();
      await pushSub.save();
    } else {
      // Create new subscription
      pushSub = await PushSubscription.create({
        user: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: subscription.userAgent,
        deviceType: subscription.deviceType,
        browser: subscription.browser,
        os: subscription.os,
        isActive: true,
        lastUsed: new Date(),
      });
    }

    logger.info(`Push subscription created/updated for user ${userId}`);
    return pushSub;
  } catch (error) {
    logger.error('Error subscribing to push notifications:', error);
    throw error;
  }
};

/**
 * Unsubscribe user from push notifications
 */
export const unsubscribeFromPush = async (
  userId: string,
  endpoint: string
): Promise<void> => {
  try {
    await PushSubscription.findOneAndUpdate(
      { user: userId, endpoint },
      { isActive: false }
    );

    logger.info(`Push subscription deactivated for user ${userId}`);
  } catch (error) {
    logger.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
};

/**
 * Get user's push subscriptions
 */
export const getUserPushSubscriptions = async (userId: string): Promise<any[]> => {
  try {
    const subscriptions = await PushSubscription.find({
      user: userId,
      isActive: true,
    });

    return subscriptions;
  } catch (error) {
    logger.error('Error fetching push subscriptions:', error);
    return [];
  }
};

/**
 * Send push notification to user
 */
export const sendPushNotification = async (
  userId: string,
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: any;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    vibrate?: number[];
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
  }
): Promise<{ sent: number; failed: number }> => {
  try {
    const subscriptions = await getUserPushSubscriptions(userId);

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/badge-72x72.png',
      image: notification.image,
      data: notification.data || {},
      tag: notification.tag,
      requireInteraction: notification.requireInteraction || false,
      silent: notification.silent || false,
      vibrate: notification.vibrate,
      actions: notification.actions,
    });

    let sent = 0;
    let failed = 0;

    // Send to all user's active subscriptions
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          payload
        );

        // Update last used
        subscription.lastUsed = new Date();
        await subscription.save();

        sent++;
      } catch (error: any) {
        failed++;

        // If subscription is invalid, mark as inactive
        if (error.statusCode === 410 || error.statusCode === 404) {
          subscription.isActive = false;
          await subscription.save();
          logger.warn(`Invalid push subscription removed: ${subscription.endpoint}`);
        } else {
          logger.error(`Error sending push notification: ${error.message}`);
        }
      }
    }

    logger.info(`Push notification sent to user ${userId}: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    logger.error('Error sending push notification:', error);
    return { sent: 0, failed: 0 };
  }
};

/**
 * Send push notification to multiple users
 */
export const sendBulkPushNotification = async (
  userIds: string[],
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: any;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    vibrate?: number[];
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
  }
): Promise<{ sent: number; failed: number }> => {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, notification);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
};

/**
 * Get VAPID public key (for frontend)
 */
export const getVapidPublicKey = (): string => {
  return vapidPublicKey;
};


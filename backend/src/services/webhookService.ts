import crypto from 'crypto';
import axios from 'axios';
import Webhook, { WebhookEventType } from '../models/Webhook';
import logger from '../utils/logger';

/**
 * Create webhook signature
 */
export const createWebhookSignature = (payload: string, secret: string): string => {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (
  signature: string,
  payload: string,
  secret: string
): boolean => {
  const expectedSignature = createWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Deliver webhook event
 */
export const deliverWebhook = async (
  webhook: any,
  eventType: string,
  data: any
): Promise<boolean> => {
  try {
    const payload = JSON.stringify({
      event: eventType,
      data,
      timestamp: new Date().toISOString(),
    });

    const signature = createWebhookSignature(payload, webhook.secret);

    const response = await axios.post(webhook.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
        'X-Webhook-Id': webhook._id.toString(),
      },
      timeout: 10000, // 10 second timeout
    });

    // Update webhook statistics
    webhook.totalDeliveries += 1;
    webhook.successfulDeliveries += 1;
    webhook.lastDeliveryAt = new Date();
    webhook.lastSuccessAt = new Date();
    await webhook.save();

    logger.info(`Webhook delivered successfully: ${webhook._id} - ${eventType}`);
    return true;
  } catch (error: any) {
    // Update webhook statistics
    webhook.totalDeliveries += 1;
    webhook.failedDeliveries += 1;
    webhook.lastDeliveryAt = new Date();
    webhook.lastFailureAt = new Date();
    webhook.lastFailureReason = error.message || 'Unknown error';
    await webhook.save();

    logger.error(`Webhook delivery failed: ${webhook._id} - ${eventType}`, error);
    return false;
  }
};

/**
 * Deliver webhook with retry logic
 */
export const deliverWebhookWithRetry = async (
  webhook: any,
  eventType: string,
  data: any,
  retryCount: number = 0
): Promise<boolean> => {
  const success = await deliverWebhook(webhook, eventType, data);

  if (!success && webhook.retryOnFailure && retryCount < webhook.maxRetries) {
    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, webhook.retryDelay * 1000));
    return deliverWebhookWithRetry(webhook, eventType, data, retryCount + 1);
  }

  return success;
};

/**
 * Trigger webhook event
 */
export const triggerWebhookEvent = async (
  eventType: string,
  data: any,
  userId?: string
): Promise<void> => {
  try {
    const query: any = {
      eventTypes: eventType,
      status: 'active',
      isActive: true,
    };

    if (userId) {
      query.user = userId;
    }

    const webhooks = await Webhook.find(query);

    // Deliver to all matching webhooks in parallel
    const deliveries = webhooks.map((webhook) =>
      deliverWebhookWithRetry(webhook, eventType, data)
    );

    await Promise.allSettled(deliveries);

    logger.info(`Webhook event triggered: ${eventType} - ${webhooks.length} webhooks`);
  } catch (error) {
    logger.error(`Error triggering webhook event: ${eventType}`, error);
  }
};

/**
 * Create webhook
 */
export const createWebhook = async (
  userId: string,
  url: string,
  eventTypes: string[],
  options: {
    retryOnFailure?: boolean;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<any> => {
  try {
    // Generate secret
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await Webhook.create({
      user: userId,
      url,
      secret,
      eventTypes,
      retryOnFailure: options.retryOnFailure !== false,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 60,
    });

    logger.info(`Webhook created: ${webhook._id} for user ${userId}`);
    return webhook;
  } catch (error) {
    logger.error('Error creating webhook:', error);
    throw error;
  }
};

/**
 * Update webhook
 */
export const updateWebhook = async (
  webhookId: string,
  userId: string,
  updates: {
    url?: string;
    eventTypes?: string[];
    status?: string;
    retryOnFailure?: boolean;
    maxRetries?: number;
    retryDelay?: number;
  }
): Promise<any> => {
  try {
    const webhook = await Webhook.findOne({ _id: webhookId, user: userId });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    if (updates.url) webhook.url = updates.url;
    if (updates.eventTypes) webhook.eventTypes = updates.eventTypes as WebhookEventType[];
    if (updates.status) webhook.status = updates.status as any;
    if (updates.retryOnFailure !== undefined) webhook.retryOnFailure = updates.retryOnFailure;
    if (updates.maxRetries !== undefined) webhook.maxRetries = updates.maxRetries;
    if (updates.retryDelay !== undefined) webhook.retryDelay = updates.retryDelay;

    webhook.isActive = updates.status === 'active';

    await webhook.save();

    logger.info(`Webhook updated: ${webhookId}`);
    return webhook;
  } catch (error) {
    logger.error('Error updating webhook:', error);
    throw error;
  }
};

/**
 * Delete webhook
 */
export const deleteWebhook = async (webhookId: string, userId: string): Promise<void> => {
  try {
    const webhook = await Webhook.findOneAndDelete({ _id: webhookId, user: userId });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    logger.info(`Webhook deleted: ${webhookId}`);
  } catch (error) {
    logger.error('Error deleting webhook:', error);
    throw error;
  }
};

/**
 * Get user's webhooks
 */
export const getUserWebhooks = async (userId: string): Promise<any[]> => {
  try {
    const webhooks = await Webhook.find({ user: userId }).sort({ createdAt: -1 });
    return webhooks;
  } catch (error) {
    logger.error('Error fetching user webhooks:', error);
    return [];
  }
};


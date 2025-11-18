import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getUserWebhooks,
} from '../services/webhookService';

// @desc    Create webhook
// @route   POST /api/webhooks
// @access  Private
export const createWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { url, eventTypes, retryOnFailure, maxRetries, retryDelay } = req.body;

  if (!url || !eventTypes || !Array.isArray(eventTypes)) {
    return res.status(400).json({
      success: false,
      message: 'url and eventTypes (array) are required',
    });
  }

  const webhook = await createWebhook(userId, url, eventTypes, {
    retryOnFailure,
    maxRetries,
    retryDelay,
  });

  res.status(201).json({
    success: true,
    webhook,
    message: 'Webhook created successfully',
  });
});

// @desc    Get user's webhooks
// @route   GET /api/webhooks
// @access  Private
export const getUserWebhooksHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const webhooks = await getUserWebhooks(userId);

  res.json({
    success: true,
    webhooks,
  });
});

// @desc    Update webhook
// @route   PUT /api/webhooks/:id
// @access  Private
export const updateWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;
  const { url, eventTypes, status, retryOnFailure, maxRetries, retryDelay } = req.body;

  const webhook = await updateWebhook(id, userId, {
    url,
    eventTypes,
    status,
    retryOnFailure,
    maxRetries,
    retryDelay,
  });

  res.json({
    success: true,
    webhook,
    message: 'Webhook updated successfully',
  });
});

// @desc    Delete webhook
// @route   DELETE /api/webhooks/:id
// @access  Private
export const deleteWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  await deleteWebhook(id, userId);

  res.json({
    success: true,
    message: 'Webhook deleted successfully',
  });
});


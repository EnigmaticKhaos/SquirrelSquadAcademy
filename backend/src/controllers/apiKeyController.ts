import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { IUser } from '../models/User';
import {
  createApiKey,
  getUserApiKeys,
  deleteApiKey,
  revokeApiKey,
} from '../services/apiKeyService';

// @desc    Create API key
// @route   POST /api/api-keys
// @access  Private
export const createApiKeyHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { name, permissions, expiresAt, rateLimit, allowedIPs } = req.body;

  if (!name || !permissions || !Array.isArray(permissions)) {
    return res.status(400).json({
      success: false,
      message: 'name and permissions (array) are required',
    });
  }

  const { apiKey, key } = await createApiKey(userId, name, permissions, {
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    rateLimit,
    allowedIPs,
  });

  res.status(201).json({
    success: true,
    apiKey: {
      _id: apiKey._id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      permissions: apiKey.permissions,
      createdAt: apiKey.createdAt,
    },
    key, // Return the key only once
    message: 'API key created successfully. Save this key securely - it will not be shown again.',
  });
});

// @desc    Get user's API keys
// @route   GET /api/api-keys
// @access  Private
export const getUserApiKeysHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const apiKeys = await getUserApiKeys(userId);

  res.json({
    success: true,
    apiKeys,
  });
});

// @desc    Delete API key
// @route   DELETE /api/api-keys/:id
// @access  Private
export const deleteApiKeyHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  await deleteApiKey(id, userId);

  res.json({
    success: true,
    message: 'API key deleted successfully',
  });
});

// @desc    Revoke API key
// @route   POST /api/api-keys/:id/revoke
// @access  Private
export const revokeApiKeyHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  await revokeApiKey(id, userId);

  res.json({
    success: true,
    message: 'API key revoked successfully',
  });
});


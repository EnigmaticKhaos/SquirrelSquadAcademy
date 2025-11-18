import crypto from 'crypto';
import ApiKey from '../models/ApiKey';
import logger from '../utils/logger';

/**
 * Generate API key
 */
export const generateApiKey = (): string => {
  const randomBytes = crypto.randomBytes(32);
  return `sk_live_${randomBytes.toString('hex')}`;
};

/**
 * Create API key
 */
export const createApiKey = async (
  userId: string,
  name: string,
  permissions: string[],
  options: {
    expiresAt?: Date;
    rateLimit?: number;
    allowedIPs?: string[];
  } = {}
): Promise<{ apiKey: any; key: string }> => {
  try {
    const key = generateApiKey();
    const keyPrefix = key.substring(0, 8);

    const apiKey = await ApiKey.create({
      user: userId,
      name,
      key,
      keyPrefix,
      permissions,
      expiresAt: options.expiresAt,
      rateLimit: options.rateLimit || 100,
      allowedIPs: options.allowedIPs,
    });

    logger.info(`API key created: ${apiKey._id} for user ${userId}`);

    // Return the key only once (it's hashed in the database)
    return { apiKey, key };
  } catch (error) {
    logger.error('Error creating API key:', error);
    throw error;
  }
};

/**
 * Get user's API keys
 */
export const getUserApiKeys = async (userId: string): Promise<any[]> => {
  try {
    const apiKeys = await ApiKey.find({ user: userId })
      .select('-key') // Don't return the actual key
      .sort({ createdAt: -1 });

    return apiKeys;
  } catch (error) {
    logger.error('Error fetching API keys:', error);
    return [];
  }
};

/**
 * Delete API key
 */
export const deleteApiKey = async (apiKeyId: string, userId: string): Promise<void> => {
  try {
    const apiKey = await ApiKey.findOneAndDelete({ _id: apiKeyId, user: userId });

    if (!apiKey) {
      throw new Error('API key not found');
    }

    logger.info(`API key deleted: ${apiKeyId}`);
  } catch (error) {
    logger.error('Error deleting API key:', error);
    throw error;
  }
};

/**
 * Revoke API key (disable it)
 */
export const revokeApiKey = async (apiKeyId: string, userId: string): Promise<void> => {
  try {
    const apiKey = await ApiKey.findOne({ _id: apiKeyId, user: userId });

    if (!apiKey) {
      throw new Error('API key not found');
    }

    apiKey.isActive = false;
    await apiKey.save();

    logger.info(`API key revoked: ${apiKeyId}`);
  } catch (error) {
    logger.error('Error revoking API key:', error);
    throw error;
  }
};


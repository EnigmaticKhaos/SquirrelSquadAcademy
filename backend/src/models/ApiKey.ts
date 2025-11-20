import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IApiKey extends Document {
  user: mongoose.Types.ObjectId;
  
  // API key details
  name: string; // User-friendly name for the key
  key: string; // The actual API key (hashed)
  keyPrefix: string; // First 8 characters for display (e.g., "sk_live_")
  
  // Permissions
  permissions: string[]; // e.g., ['courses:read', 'webhooks:write']
  
  // Status
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  
  // Rate limiting
  rateLimit?: number; // Requests per minute
  rateLimitWindow?: number; // Window in seconds
  
  // IP restrictions (optional)
  allowedIPs?: string[];
  
  // Usage statistics
  requestCount: number;
  lastRequestIP?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  compareKey(candidateKey: string): boolean;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      select: false, // Don't return key by default
    },
    keyPrefix: {
      type: String,
      required: true,
    },
    permissions: [{
      type: String,
      required: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: Date,
    expiresAt: Date,
    rateLimit: {
      type: Number,
      default: 100, // 100 requests per minute
    },
    rateLimitWindow: {
      type: Number,
      default: 60, // 60 seconds
    },
    allowedIPs: [String],
    requestCount: {
      type: Number,
      default: 0,
    },
    lastRequestIP: String,
  },
  {
    timestamps: true,
  }
);

apiKeySchema.index({ user: 1, isActive: 1 });
apiKeySchema.index({ keyPrefix: 1 });

// Hash API key before saving
apiKeySchema.pre('save', async function(next) {
  if (this.isModified('key') && !this.key.startsWith('$2')) {
    // Hash the key using bcrypt-like approach (or use crypto)
    const hash = crypto.createHash('sha256').update(this.key).digest('hex');
    this.key = hash;
  }
  next();
});

// Method to compare API key
apiKeySchema.methods.compareKey = function(candidateKey: string): boolean {
  const hash = crypto.createHash('sha256').update(candidateKey).digest('hex');
  return this.key === hash;
};

export default mongoose.model<IApiKey>('ApiKey', apiKeySchema);


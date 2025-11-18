import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
  user: mongoose.Types.ObjectId;
  
  // Web Push subscription details
  endpoint: string; // Push service endpoint URL
  keys: {
    p256dh: string; // User's public key
    auth: string; // Authentication secret
  };
  
  // Device/browser info
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  
  // Status
  isActive: boolean;
  lastUsed?: Date; // Last time subscription was used
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
    userAgent: String,
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
    },
    browser: String,
    os: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsed: Date,
  },
  {
    timestamps: true,
  }
);

pushSubscriptionSchema.index({ user: 1, isActive: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

export default mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);


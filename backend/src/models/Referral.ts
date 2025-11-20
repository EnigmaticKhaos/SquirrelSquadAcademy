import mongoose, { Document, Schema } from 'mongoose';

export type ReferralStatus = 'pending' | 'completed' | 'expired';

export interface IReferral extends Document {
  // Referrer (person who created the referral)
  referrer: mongoose.Types.ObjectId;
  
  // Referral code
  code: string;
  
  // Referred user (person who used the code)
  referredUser?: mongoose.Types.ObjectId;
  
  // Status
  status: ReferralStatus;
  
  // Rewards
  referrerReward?: {
    type: 'xp' | 'subscription_days' | 'badge' | 'achievement';
    amount?: number;
    itemId?: mongoose.Types.ObjectId; // For badge/achievement
    granted: boolean;
    grantedAt?: Date;
  };
  referredReward?: {
    type: 'xp' | 'subscription_days' | 'badge' | 'achievement';
    amount?: number;
    itemId?: mongoose.Types.ObjectId; // For badge/achievement
    granted: boolean;
    grantedAt?: Date;
  };
  
  // Conditions
  requiresPurchase?: boolean; // Whether referred user must make a purchase
  requiresSubscription?: boolean; // Whether referred user must subscribe
  expiresAt?: Date;
  
  // Metadata
  metadata?: {
    [key: string]: any;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    referredUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired'],
      default: 'pending',
      index: true,
    },
    referrerReward: {
      type: {
        type: String,
        enum: ['xp', 'subscription_days', 'badge', 'achievement'],
      },
      amount: Number,
      itemId: {
        type: Schema.Types.ObjectId,
        refPath: 'referrerReward.type',
      },
      granted: {
        type: Boolean,
        default: false,
      },
      grantedAt: Date,
    },
    referredReward: {
      type: {
        type: String,
        enum: ['xp', 'subscription_days', 'badge', 'achievement'],
      },
      amount: Number,
      itemId: {
        type: Schema.Types.ObjectId,
        refPath: 'referredReward.type',
      },
      granted: {
        type: Boolean,
        default: false,
      },
      grantedAt: Date,
    },
    requiresPurchase: {
      type: Boolean,
      default: false,
    },
    requiresSubscription: {
      type: Boolean,
      default: false,
    },
    expiresAt: Date,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referredUser: 1 });
// code already has unique: true which creates an index automatically
referralSchema.index({ expiresAt: 1, status: 1 });

export default mongoose.model<IReferral>('Referral', referralSchema);


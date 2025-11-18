import mongoose, { Document, Schema } from 'mongoose';

export interface IUserBadge extends Document {
  user: mongoose.Types.ObjectId;
  badge: mongoose.Types.ObjectId;
  isProfileCardBadge: boolean;
  unlockedAt: Date;
  createdAt: Date;
}

const userBadgeSchema = new Schema<IUserBadge>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    badge: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
    },
    isProfileCardBadge: {
      type: Boolean,
      default: false,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });
userBadgeSchema.index({ user: 1, isProfileCardBadge: 1 });

export default mongoose.model<IUserBadge>('UserBadge', userBadgeSchema);


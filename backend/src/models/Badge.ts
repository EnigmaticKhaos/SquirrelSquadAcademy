import mongoose, { Document, Schema } from 'mongoose';

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockCriteria: {
    type: string;
    value: any;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const badgeSchema = new Schema<IBadge>(
  {
    name: {
      type: String,
      required: [true, 'Badge name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Badge description is required'],
    },
    icon: {
      type: String,
      required: [true, 'Badge icon is required'],
    },
    category: String,
    unlockCriteria: {
      type: {
        type: String,
        required: true,
      },
      value: Schema.Types.Mixed,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

badgeSchema.index({ isActive: 1 });

export default mongoose.model<IBadge>('Badge', badgeSchema);


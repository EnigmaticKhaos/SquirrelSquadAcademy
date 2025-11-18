import mongoose, { Document, Schema } from 'mongoose';

export type AchievementTier = 
  | 'common' 
  | 'uncommon' 
  | 'rare' 
  | 'epic' 
  | 'legendary' 
  | 'exotic' 
  | 'mythic';

export type AchievementCategory = 
  | 'course' 
  | 'lesson' 
  | 'quiz' 
  | 'assignment' 
  | 'social' 
  | 'streak' 
  | 'special' 
  | 'project';

export interface IAchievement extends Document {
  name: string;
  description: string;
  tier: AchievementTier;
  category: AchievementCategory;
  icon?: string;
  xpReward: number;
  
  // Unlock criteria
  unlockCriteria: {
    type: string; // e.g., 'complete_course', 'earn_xp', 'complete_assignments'
    value: any; // The value needed to unlock
    [key: string]: any;
  };
  
  // Validation
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    name: {
      type: String,
      required: [true, 'Achievement name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required'],
    },
    tier: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'exotic', 'mythic'],
      required: [true, 'Achievement tier is required'],
    },
    category: {
      type: String,
      enum: ['course', 'lesson', 'quiz', 'assignment', 'social', 'streak', 'special', 'project'],
      required: [true, 'Achievement category is required'],
    },
    icon: String,
    xpReward: {
      type: Number,
      default: 0,
      min: 0,
    },
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

achievementSchema.index({ tier: 1, category: 1 });
achievementSchema.index({ isActive: 1 });

export default mongoose.model<IAchievement>('Achievement', achievementSchema);


import mongoose, { Document, Schema } from 'mongoose';

export type ChallengeType = 
  | 'complete_courses'
  | 'earn_xp'
  | 'reach_level'
  | 'complete_assignments'
  | 'share_projects'
  | 'social_engagement'
  | 'custom';

export type ChallengeStatus = 'upcoming' | 'active' | 'ended';

export interface IChallenge extends Document {
  title: string;
  description: string; // Should mention these are optional bonus opportunities
  type: ChallengeType;
  
  // Challenge criteria
  targetValue: number;
  
  // Custom criteria (for custom type)
  customCriteria?: {
    type: string;
    value: any;
    [key: string]: any;
  };
  
  // Timing
  startDate: Date;
  endDate: Date;
  status: ChallengeStatus;
  
  // Participation
  participantCount: number;
  maxParticipants?: number;
  
  // Rewards
  xpReward?: number;
  badgeReward?: mongoose.Types.ObjectId;
  achievementReward?: mongoose.Types.ObjectId;
  
  // Eligibility
  eligibilityCriteria?: {
    minLevel?: number;
    minXP?: number;
    subscriptionTier?: 'free' | 'premium' | 'all';
    [key: string]: any;
  };
  
  // Leaderboard
  showLeaderboard: boolean;
  leaderboardType?: 'top' | 'all'; // Show top N or all participants
  
  // Visibility
  isPublic: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const challengeSchema = new Schema<IChallenge>(
  {
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Challenge description is required'],
    },
    type: {
      type: String,
      enum: ['complete_courses', 'earn_xp', 'reach_level', 'complete_assignments', 'share_projects', 'social_engagement', 'custom'],
      required: true,
    },
    targetValue: {
      type: Number,
      required: true,
      min: 1,
    },
    customCriteria: {
      type: {
        type: String,
      },
      value: Schema.Types.Mixed,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'ended'],
      default: 'upcoming',
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    maxParticipants: Number,
    xpReward: {
      type: Number,
      min: 0,
    },
    badgeReward: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
    },
    achievementReward: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
    },
    eligibilityCriteria: {
      minLevel: Number,
      minXP: Number,
      subscriptionTier: {
        type: String,
        enum: ['free', 'premium', 'all'],
      },
    },
    showLeaderboard: {
      type: Boolean,
      default: true,
    },
    leaderboardType: {
      type: String,
      enum: ['top', 'all'],
      default: 'top',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

challengeSchema.index({ status: 1, startDate: 1, endDate: 1 });
challengeSchema.index({ type: 1, status: 1 });
challengeSchema.index({ isPublic: 1, status: 1 });

export default mongoose.model<IChallenge>('Challenge', challengeSchema);


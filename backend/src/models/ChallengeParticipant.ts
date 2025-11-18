import mongoose, { Document, Schema } from 'mongoose';

export interface IChallengeParticipant extends Document {
  challenge: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  
  // Progress
  currentValue: number;
  progressPercentage: number;
  
  // Ranking
  rank?: number;
  
  // Completion
  completedAt?: Date;
  isCompleted: boolean;
  
  // Rewards
  rewardsClaimed: {
    xp: boolean;
    badge: boolean;
    achievement: boolean;
  };
  
  // Timestamps
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const challengeParticipantSchema = new Schema<IChallengeParticipant>(
  {
    challenge: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    rank: Number,
    completedAt: Date,
    isCompleted: {
      type: Boolean,
      default: false,
    },
    rewardsClaimed: {
      xp: {
        type: Boolean,
        default: false,
      },
      badge: {
        type: Boolean,
        default: false,
      },
      achievement: {
        type: Boolean,
        default: false,
      },
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

challengeParticipantSchema.index({ challenge: 1, user: 1 }, { unique: true });
challengeParticipantSchema.index({ challenge: 1, currentValue: -1 });
challengeParticipantSchema.index({ challenge: 1, rank: 1 });
challengeParticipantSchema.index({ user: 1, isCompleted: 1 });

export default mongoose.model<IChallengeParticipant>('ChallengeParticipant', challengeParticipantSchema);


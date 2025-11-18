import mongoose, { Document, Schema } from 'mongoose';

export type XPSource = 
  | 'lesson_completed' 
  | 'quiz_passed' 
  | 'assignment_submitted' 
  | 'post_created' 
  | 'comment_created' 
  | 'like_received' 
  | 'daily_login' 
  | 'streak_milestone' 
  | 'project_shared'
  | 'achievement_unlocked'
  | 'badge_earned'
  | 'mentor_approved'
  | 'mentorship_session'
  | 'mentorship_milestone'
  | 'mentorship_completed'
  | 'mentorship_completed_mentor'
  | 'referral'
  | 'goal_completed';

export interface IUserXP extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  source: XPSource;
  sourceId?: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
}

const userXPSchema = new Schema<IUserXP>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    source: {
      type: String,
      enum: [
        'lesson_completed',
        'quiz_passed',
        'assignment_submitted',
        'post_created',
        'comment_created',
        'like_received',
        'daily_login',
        'streak_milestone',
        'project_shared',
        'achievement_unlocked',
        'badge_earned',
        'mentor_approved',
        'mentorship_session',
        'mentorship_milestone',
        'mentorship_completed',
        'mentorship_completed_mentor',
        'referral',
        'goal_completed',
      ],
      required: true,
    },
    sourceId: Schema.Types.ObjectId,
    description: String,
  },
  {
    timestamps: true,
  }
);

userXPSchema.index({ user: 1, createdAt: -1 });
userXPSchema.index({ source: 1 });

export default mongoose.model<IUserXP>('UserXP', userXPSchema);


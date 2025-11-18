import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'social_like'
  | 'social_comment'
  | 'social_mention'
  | 'social_follow'
  | 'social_friend_request'
  | 'social_friend_accepted'
  | 'message_received'
  | 'achievement_unlocked'
  | 'badge_earned'
  | 'level_up'
  | 'course_enrolled'
  | 'course_completed'
  | 'course_update'
  | 'course_announcement'
  | 'forum_reply'
  | 'forum_mention'
  | 'assignment_graded'
  | 'assignment_feedback'
  | 'challenge_started'
  | 'challenge_completed'
  | 'goal_completed'
  | 'waitlist_notification'
  | 'referral_success'
  | 'system_announcement';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId; // Recipient
  type: NotificationType;
  
  // Content
  title: string;
  message: string;
  actionUrl?: string; // URL to navigate to when clicked
  
  // Related entities (polymorphic)
  relatedUser?: mongoose.Types.ObjectId; // User who triggered the notification
  relatedCourse?: mongoose.Types.ObjectId;
  relatedPost?: mongoose.Types.ObjectId;
  relatedComment?: mongoose.Types.ObjectId;
  relatedMessage?: mongoose.Types.ObjectId;
  relatedAchievement?: mongoose.Types.ObjectId;
  relatedBadge?: mongoose.Types.ObjectId;
  relatedAssignment?: mongoose.Types.ObjectId;
  relatedForumPost?: mongoose.Types.ObjectId;
  
  // Metadata
  metadata?: {
    [key: string]: any;
  };
  
  // Status
  read: boolean;
  readAt?: Date;
  
  // Priority
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'social_like',
        'social_comment',
        'social_mention',
        'social_follow',
        'social_friend_request',
        'social_friend_accepted',
        'message_received',
        'achievement_unlocked',
        'badge_earned',
        'level_up',
        'course_enrolled',
        'course_completed',
        'course_update',
        'course_announcement',
        'forum_reply',
        'forum_mention',
        'assignment_graded',
        'assignment_feedback',
        'challenge_started',
        'challenge_completed',
        'goal_completed',
        'waitlist_notification',
        'referral_success',
        'system_announcement',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    actionUrl: String,
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedCourse: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    relatedPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    relatedComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    relatedMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    relatedAchievement: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
    },
    relatedBadge: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
    },
    relatedAssignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
    },
    relatedForumPost: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
    },
    metadata: Schema.Types.Mixed,
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);


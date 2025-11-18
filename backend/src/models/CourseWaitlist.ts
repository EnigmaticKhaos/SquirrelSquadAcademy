import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseWaitlist extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  
  // Position in waitlist
  position: number;
  
  // Status
  status: 'waiting' | 'notified' | 'enrolled' | 'removed' | 'expired';
  
  // Notification
  notifiedAt?: Date;
  notificationSent: boolean;
  
  // Enrollment
  enrolledAt?: Date;
  
  // Expiration (optional - waitlist entries can expire after X days)
  expiresAt?: Date;
  
  // Timestamps
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseWaitlistSchema = new Schema<ICourseWaitlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    position: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['waiting', 'notified', 'enrolled', 'removed', 'expired'],
      default: 'waiting',
    },
    notifiedAt: Date,
    notificationSent: {
      type: Boolean,
      default: false,
    },
    enrolledAt: Date,
    expiresAt: Date,
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one waitlist entry per user per course
courseWaitlistSchema.index({ user: 1, course: 1 }, { unique: true });
courseWaitlistSchema.index({ course: 1, position: 1 });
courseWaitlistSchema.index({ course: 1, status: 1 });
courseWaitlistSchema.index({ status: 1, notifiedAt: 1 });
courseWaitlistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-expiration

export default mongoose.model<ICourseWaitlist>('CourseWaitlist', courseWaitlistSchema);


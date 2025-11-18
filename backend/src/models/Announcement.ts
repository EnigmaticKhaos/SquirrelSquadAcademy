import mongoose, { Document, Schema } from 'mongoose';

export type AnnouncementType = 'platform' | 'course' | 'maintenance' | 'feature';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  
  // Targeting
  targetAudience?: {
    allUsers: boolean;
    userRoles?: ('user' | 'admin')[];
    subscriptionTiers?: ('free' | 'premium')[];
    enrolledCourses?: mongoose.Types.ObjectId[];
    specificUsers?: mongoose.Types.ObjectId[];
  };
  
  // Course-specific (if type is 'course')
  course?: mongoose.Types.ObjectId;
  
  // Scheduling
  scheduledFor?: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  
  // Media
  imageUrl?: string;
  videoUrl?: string;
  actionUrl?: string; // Link to related content
  
  // Engagement
  views: number;
  readBy: mongoose.Types.ObjectId[]; // Users who have read this
  
  // Author
  author: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['platform', 'course', 'maintenance', 'feature'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    targetAudience: {
      allUsers: {
        type: Boolean,
        default: true,
      },
      userRoles: [{
        type: String,
        enum: ['user', 'admin'],
      }],
      subscriptionTiers: [{
        type: String,
        enum: ['free', 'premium'],
      }],
      enrolledCourses: [{
        type: Schema.Types.ObjectId,
        ref: 'Course',
      }],
      specificUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    scheduledFor: Date,
    publishedAt: Date,
    expiresAt: Date,
    imageUrl: String,
    videoUrl: String,
    actionUrl: String,
    views: {
      type: Number,
      default: 0,
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
announcementSchema.index({ status: 1, publishedAt: -1 });
announcementSchema.index({ type: 1, status: 1 });
announcementSchema.index({ course: 1, status: 1 });
announcementSchema.index({ scheduledFor: 1, status: 1 });
announcementSchema.index({ expiresAt: 1, status: 1 });
announcementSchema.index({ 'targetAudience.specificUsers': 1 });

export default mongoose.model<IAnnouncement>('Announcement', announcementSchema);


import mongoose, { Document, Schema } from 'mongoose';

export type ForumPostType = 'question' | 'discussion' | 'announcement';

export interface IForumPost extends Document {
  course: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  
  // Post content
  type: ForumPostType;
  title: string;
  content: string;
  
  // Threading
  parentPost?: mongoose.Types.ObjectId; // For replies
  isAnswer: boolean; // Marked as answer to a question
  markedAsHelpful: boolean; // Marked as helpful answer
  
  // Engagement
  views: number;
  upvotes: number;
  downvotes: number;
  repliesCount: number;
  
  // Status
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean; // For questions
  
  // Tags
  tags: string[];
  
  // Mentions
  mentions: mongoose.Types.ObjectId[];
  
  // Timestamps
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const forumPostSchema = new Schema<IForumPost>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['question', 'discussion', 'announcement'],
      default: 'discussion',
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    parentPost: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
    },
    isAnswer: {
      type: Boolean,
      default: false,
    },
    markedAsHelpful: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    mentions: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

forumPostSchema.index({ course: 1, createdAt: -1 });
forumPostSchema.index({ course: 1, isPinned: -1, lastActivityAt: -1 });
forumPostSchema.index({ parentPost: 1, createdAt: 1 });
forumPostSchema.index({ author: 1 });
forumPostSchema.index({ course: 1, type: 1 });
forumPostSchema.index({ course: 1, tags: 1 });
forumPostSchema.index({ title: 'text', content: 'text' });

export default mongoose.model<IForumPost>('ForumPost', forumPostSchema);


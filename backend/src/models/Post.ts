import mongoose, { Document, Schema } from 'mongoose';

export type PostType = 'text' | 'image' | 'video';

export interface IPost extends Document {
  user: mongoose.Types.ObjectId;
  content: string;
  type: PostType;
  media?: Array<{
    url: string;
    type: string;
  }>;
  
  // Mentions
  mentions: mongoose.Types.ObjectId[];
  
  // Engagement
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  
  // Project sharing
  sharedProject?: mongoose.Types.ObjectId;
  
  // Visibility
  isPublic: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },
    media: [{
      url: String,
      type: String,
    }],
    mentions: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
    },
    sharedProject: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
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

postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ mentions: 1 });
// Text index for search (MongoDB allows only one text index per collection)
postSchema.index({ content: 'text' });

export default mongoose.model<IPost>('Post', postSchema);


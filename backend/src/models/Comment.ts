import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  user: mongoose.Types.ObjectId;
  post?: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId; // For nested comments
  content: string;
  
  // Mentions
  mentions: mongoose.Types.ObjectId[];
  
  // Engagement
  likesCount: number;
  repliesCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
    },
    mentions: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    likesCount: {
      type: Number,
      default: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
// Text index for search (MongoDB allows only one text index per collection)
commentSchema.index({ content: 'text' });

export default mongoose.model<IComment>('Comment', commentSchema);


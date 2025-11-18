import mongoose, { Document, Schema } from 'mongoose';

export type LikeType = 'post' | 'comment' | 'project';
export type EmojiType = '👍' | '❤️' | '😂' | '🎉' | '🔥' | '😮' | '😢';

export interface ILike extends Document {
  user: mongoose.Types.ObjectId;
  targetType: LikeType;
  targetId: mongoose.Types.ObjectId;
  emoji: EmojiType;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'project'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
    emoji: {
      type: String,
      enum: ['👍', '❤️', '😂', '🎉', '🔥', '😮', '😢'],
      default: '👍',
    },
  },
  {
    timestamps: true,
  }
);

likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model<ILike>('Like', likeSchema);


import mongoose, { Document, Schema } from 'mongoose';

export type VoteType = 'upvote' | 'downvote';

export interface IForumVote extends Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  voteType: VoteType;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const forumVoteSchema = new Schema<IForumVote>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: true,
    },
    voteType: {
      type: String,
      enum: ['upvote', 'downvote'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

forumVoteSchema.index({ user: 1, post: 1 }, { unique: true });
forumVoteSchema.index({ post: 1, voteType: 1 });

export default mongoose.model<IForumVote>('ForumVote', forumVoteSchema);


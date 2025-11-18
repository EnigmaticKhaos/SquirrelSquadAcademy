import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseReview extends Document {
  course: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  
  // Ratings
  rating: number; // 1-5 stars
  difficultyRating?: number; // 1-5 (1=too easy, 5=too hard)
  
  // Review content
  title?: string;
  content: string;
  
  // Engagement
  helpfulCount: number;
  notHelpfulCount: number;
  
  // User feedback
  helpfulVotes: mongoose.Types.ObjectId[]; // Users who found it helpful
  notHelpfulVotes: mongoose.Types.ObjectId[]; // Users who found it not helpful
  
  // Status
  isVerified: boolean; // User completed the course
  isPublic: boolean;
  
  // Moderation
  isReported: boolean;
  isApproved: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const courseReviewSchema = new Schema<ICourseReview>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    title: String,
    content: {
      type: String,
      required: [true, 'Review content is required'],
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulVotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    notHelpfulVotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

courseReviewSchema.index({ course: 1, user: 1 }, { unique: true });
courseReviewSchema.index({ course: 1, rating: 1 });
courseReviewSchema.index({ course: 1, createdAt: -1 });
courseReviewSchema.index({ course: 1, helpfulCount: -1 });
courseReviewSchema.index({ user: 1 });
courseReviewSchema.index({ content: 'text' });

export default mongoose.model<ICourseReview>('CourseReview', courseReviewSchema);


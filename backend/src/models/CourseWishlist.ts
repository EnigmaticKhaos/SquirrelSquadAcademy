import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseWishlist extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  
  // Notification preferences
  notifyOnSale: boolean;
  notifyOnRelease: boolean;
  
  // Timestamps
  addedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseWishlistSchema = new Schema<ICourseWishlist>(
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
    notifyOnSale: {
      type: Boolean,
      default: true,
    },
    notifyOnRelease: {
      type: Boolean,
      default: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

courseWishlistSchema.index({ user: 1, course: 1 }, { unique: true });
courseWishlistSchema.index({ user: 1, addedAt: -1 });
courseWishlistSchema.index({ course: 1 });

export default mongoose.model<ICourseWishlist>('CourseWishlist', courseWishlistSchema);


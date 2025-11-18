import mongoose, { Document, Schema } from 'mongoose';

export interface IBundlePurchase extends Document {
  user: mongoose.Types.ObjectId;
  bundle: mongoose.Types.ObjectId;
  
  // Purchase details
  price: number;
  currency: string;
  discountAmount?: number;
  
  // Payment
  stripePaymentIntentId?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Enrollment
  coursesEnrolled: mongoose.Types.ObjectId[];
  enrolledAt: Date;
  
  // Timestamps
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bundlePurchaseSchema = new Schema<IBundlePurchase>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bundle: {
      type: Schema.Types.ObjectId,
      ref: 'CourseBundle',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    discountAmount: Number,
    stripePaymentIntentId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    coursesEnrolled: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
    }],
    enrolledAt: Date,
  },
  {
    timestamps: true,
  }
);

bundlePurchaseSchema.index({ user: 1, bundle: 1 }, { unique: true });
bundlePurchaseSchema.index({ user: 1, purchasedAt: -1 });
bundlePurchaseSchema.index({ bundle: 1 });
bundlePurchaseSchema.index({ paymentStatus: 1 });

export default mongoose.model<IBundlePurchase>('BundlePurchase', bundlePurchaseSchema);


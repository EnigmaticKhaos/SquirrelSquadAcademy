import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseBundle extends Document {
  name: string;
  description: string;
  
  // Bundle content
  courses: mongoose.Types.ObjectId[];
  
  // Pricing
  price: number;
  currency: string;
  originalPrice?: number; // Total price if courses were purchased separately
  discountPercentage?: number; // Calculated discount
  
  // Metadata
  thumbnail?: string;
  tags: string[];
  category?: string;
  
  // Status
  isActive: boolean;
  isPublic: boolean;
  startDate?: Date;
  endDate?: Date; // For limited-time bundles
  
  // Statistics
  salesCount: number;
  enrollmentCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const courseBundleSchema = new Schema<ICourseBundle>(
  {
    name: {
      type: String,
      required: [true, 'Bundle name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Bundle description is required'],
    },
    courses: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    }],
    price: {
      type: Number,
      required: [true, 'Bundle price is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    originalPrice: Number,
    discountPercentage: Number,
    thumbnail: String,
    tags: [String],
    category: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    startDate: Date,
    endDate: Date,
    salesCount: {
      type: Number,
      default: 0,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

courseBundleSchema.index({ isActive: 1, isPublic: 1 });
courseBundleSchema.index({ tags: 1 });
courseBundleSchema.index({ category: 1 });
courseBundleSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<ICourseBundle>('CourseBundle', courseBundleSchema);


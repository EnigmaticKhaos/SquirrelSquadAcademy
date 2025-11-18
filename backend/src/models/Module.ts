import mongoose, { Document, Schema } from 'mongoose';

export interface IModule extends Document {
  course: mongoose.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  lessons: mongoose.Types.ObjectId[];
  isUnlocked: boolean;
  prerequisites?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<IModule>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },
    description: String,
    order: {
      type: Number,
      required: true,
    },
    lessons: [{
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    }],
    isUnlocked: {
      type: Boolean,
      default: true,
    },
    prerequisites: [{
      type: Schema.Types.ObjectId,
      ref: 'Module',
    }],
  },
  {
    timestamps: true,
  }
);

moduleSchema.index({ course: 1, order: 1 });

export default mongoose.model<IModule>('Module', moduleSchema);


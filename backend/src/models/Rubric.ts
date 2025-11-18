import mongoose, { Document, Schema } from 'mongoose';

export type RubricType = 'coding' | 'non-coding';

export interface IRubricCriteria {
  name: string;
  description: string;
  points: number;
  maxPoints: number;
}

export interface IRubric extends Document {
  name: string;
  description: string;
  rubricType: RubricType;
  criteria: IRubricCriteria[];
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const rubricSchema = new Schema<IRubric>(
  {
    name: {
      type: String,
      required: [true, 'Rubric name is required'],
      trim: true,
    },
    description: String,
    rubricType: {
      type: String,
      enum: ['coding', 'non-coding'],
      required: [true, 'Rubric type is required'],
    },
    criteria: [{
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      points: {
        type: Number,
        default: 0,
        min: 0,
      },
      maxPoints: {
        type: Number,
        required: true,
        min: 0,
      },
    }],
    totalPoints: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total points before saving
rubricSchema.pre('save', function (next) {
  if (this.isModified('criteria')) {
    this.totalPoints = this.criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
  }
  next();
});

rubricSchema.index({ rubricType: 1 });

export default mongoose.model<IRubric>('Rubric', rubricSchema);


import mongoose, { Document, Schema } from 'mongoose';

export interface IGradeCriteriaScore {
  criteriaName: string;
  points: number;
  maxPoints: number;
  feedback?: string;
}

export interface IGrade extends Document {
  submission: mongoose.Types.ObjectId;
  assignment: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  rubric: mongoose.Types.ObjectId;
  
  // Scoring
  score: number;
  maxScore: number;
  percentage: number;
  criteriaScores: IGradeCriteriaScore[];
  
  // AI Grading details
  aiFeedback: string;
  aiGradingDetails?: any;
  
  // Timestamps
  gradedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gradeSchema = new Schema<IGrade>(
  {
    submission: {
      type: Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      unique: true,
    },
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
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
    rubric: {
      type: Schema.Types.ObjectId,
      ref: 'Rubric',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    criteriaScores: [{
      criteriaName: {
        type: String,
        required: true,
      },
      points: {
        type: Number,
        required: true,
        min: 0,
      },
      maxPoints: {
        type: Number,
        required: true,
        min: 0,
      },
      feedback: String,
    }],
    aiFeedback: {
      type: String,
      required: true,
    },
    aiGradingDetails: Schema.Types.Mixed,
    gradedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

gradeSchema.index({ user: 1, course: 1 });
gradeSchema.index({ assignment: 1 });
gradeSchema.index({ gradedAt: -1 });

export default mongoose.model<IGrade>('Grade', gradeSchema);


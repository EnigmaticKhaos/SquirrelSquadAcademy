import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionStatus = 'pending' | 'grading' | 'graded' | 'failed';

export interface ISubmission extends Document {
  assignment: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  
  // Submission content
  content: string; // Code, text, file URLs, etc.
  files?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  
  // For GitHub assignments
  githubRepoUrl?: string;
  githubCommitSha?: string;
  
  // Grading
  status: SubmissionStatus;
  grade?: mongoose.Types.ObjectId;
  score?: number;
  maxScore: number;
  feedback?: string;
  
  // Retry tracking
  attemptNumber: number;
  
  // Timestamps
  submittedAt: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
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
    content: {
      type: String,
      required: [true, 'Submission content is required'],
    },
    files: [{
      name: String,
      url: String,
      type: String,
    }],
    githubRepoUrl: String,
    githubCommitSha: String,
    status: {
      type: String,
      enum: ['pending', 'grading', 'graded', 'failed'],
      default: 'pending',
    },
    grade: {
      type: Schema.Types.ObjectId,
      ref: 'Grade',
    },
    score: Number,
    maxScore: {
      type: Number,
      required: true,
    },
    feedback: String,
    attemptNumber: {
      type: Number,
      default: 1,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    gradedAt: Date,
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ assignment: 1, user: 1 });
submissionSchema.index({ user: 1, course: 1 });
submissionSchema.index({ status: 1 });

export default mongoose.model<ISubmission>('Submission', submissionSchema);


import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizQuestion {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
}

export interface IQuiz extends Document {
  lesson: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  description: string;
  questions: IQuizQuestion[];
  rubric: mongoose.Types.ObjectId;
  totalPoints: number;
  timeLimit?: number; // in minutes
  allowRetries: boolean;
  maxRetries?: number;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    description: String,
    questions: [{
      question: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['multiple-choice', 'true-false', 'short-answer'],
        required: true,
      },
      options: [String],
      correctAnswer: Schema.Types.Mixed,
      points: {
        type: Number,
        required: true,
        min: 0,
      },
      explanation: String,
    }],
    rubric: {
      type: Schema.Types.ObjectId,
      ref: 'Rubric',
      required: true,
    },
    totalPoints: {
      type: Number,
      required: true,
      min: 0,
    },
    timeLimit: Number,
    allowRetries: {
      type: Boolean,
      default: true,
    },
    maxRetries: Number,
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ lesson: 1, course: 1 });

export default mongoose.model<IQuiz>('Quiz', quizSchema);


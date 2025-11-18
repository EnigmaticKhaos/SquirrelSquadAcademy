import mongoose, { Document, Schema } from 'mongoose';

export type ExerciseType = 'cli' | 'coding' | 'written';

export interface IExercise extends Document {
  lesson: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  description: string;
  exerciseType: ExerciseType;
  rubric: mongoose.Types.ObjectId;
  
  // For CLI exercises
  expectedCommands?: string[];
  commandOnly: boolean;
  
  // For coding exercises
  starterCode?: string;
  testCases?: any[];
  language?: string;
  
  totalPoints: number;
  allowRetries: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
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
      required: [true, 'Exercise title is required'],
      trim: true,
    },
    description: String,
    exerciseType: {
      type: String,
      enum: ['cli', 'coding', 'written'],
      required: true,
    },
    rubric: {
      type: Schema.Types.ObjectId,
      ref: 'Rubric',
      required: true,
    },
    expectedCommands: [String],
    commandOnly: {
      type: Boolean,
      default: false,
    },
    starterCode: String,
    testCases: [Schema.Types.Mixed],
    language: String,
    totalPoints: {
      type: Number,
      required: true,
      min: 0,
    },
    allowRetries: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

exerciseSchema.index({ lesson: 1, course: 1 });

export default mongoose.model<IExercise>('Exercise', exerciseSchema);


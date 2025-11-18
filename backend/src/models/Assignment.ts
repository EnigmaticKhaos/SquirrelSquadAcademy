import mongoose, { Document, Schema } from 'mongoose';

export type AssignmentType = 
  | 'coding' 
  | 'github' 
  | 'written' 
  | 'design' 
  | 'business' 
  | 'marketing' 
  | 'writing' 
  | 'cli';

export interface IAssignment extends Document {
  lesson: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  description: string;
  assignmentType: AssignmentType;
  rubric: mongoose.Types.ObjectId;
  
  // For coding assignments
  starterCode?: string;
  testCases?: any[];
  language?: string;
  
  // For GitHub assignments
  githubRepoUrl?: string;
  githubOrg?: string;
  
  // For CLI assignments
  expectedCommands?: string[];
  commandOnly: boolean;
  
  // Submission settings
  allowRetries: boolean;
  maxRetries?: number;
  deadline?: Date;
  
  // Points
  totalPoints: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
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
      required: [true, 'Assignment title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
    },
    assignmentType: {
      type: String,
      enum: ['coding', 'github', 'written', 'design', 'business', 'marketing', 'writing', 'cli'],
      required: [true, 'Assignment type is required'],
    },
    rubric: {
      type: Schema.Types.ObjectId,
      ref: 'Rubric',
      required: true,
    },
    starterCode: String,
    testCases: [Schema.Types.Mixed],
    language: String,
    githubRepoUrl: String,
    githubOrg: String,
    expectedCommands: [String],
    commandOnly: {
      type: Boolean,
      default: false,
    },
    allowRetries: {
      type: Boolean,
      default: true,
    },
    maxRetries: Number,
    deadline: Date,
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

assignmentSchema.index({ lesson: 1, course: 1 });
assignmentSchema.index({ assignmentType: 1 });

export default mongoose.model<IAssignment>('Assignment', assignmentSchema);


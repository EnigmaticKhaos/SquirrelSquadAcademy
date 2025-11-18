import mongoose, { Document, Schema } from 'mongoose';

export type SupportedLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin'
  | 'dart'
  | 'r'
  | 'sql'
  | 'html'
  | 'css'
  | 'bash'
  | 'powershell';

export interface ICodeSnippet extends Document {
  user: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId; // Optional: associated with a course
  lesson?: mongoose.Types.ObjectId; // Optional: associated with a lesson
  assignment?: mongoose.Types.ObjectId; // Optional: associated with an assignment
  
  // Code content
  title?: string;
  code: string;
  language: SupportedLanguage;
  
  // Execution
  lastExecuted?: Date;
  executionResult?: {
    output?: string;
    error?: string;
    executionTime?: number; // in milliseconds
    memoryUsed?: number; // in bytes
    status: 'success' | 'error' | 'timeout' | 'runtime_error';
  };
  
  // Metadata
  isPublic: boolean;
  tags?: string[];
  description?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const codeSnippetSchema = new Schema<ICodeSnippet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
    },
    title: String,
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: [
        'javascript',
        'typescript',
        'python',
        'java',
        'cpp',
        'c',
        'csharp',
        'go',
        'rust',
        'ruby',
        'php',
        'swift',
        'kotlin',
        'dart',
        'r',
        'sql',
        'html',
        'css',
        'bash',
        'powershell',
      ],
      required: true,
    },
    lastExecuted: Date,
    executionResult: {
      output: String,
      error: String,
      executionTime: Number,
      memoryUsed: Number,
      status: {
        type: String,
        enum: ['success', 'error', 'timeout', 'runtime_error'],
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    description: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
codeSnippetSchema.index({ user: 1, createdAt: -1 });
codeSnippetSchema.index({ course: 1, lesson: 1 });
codeSnippetSchema.index({ isPublic: 1, createdAt: -1 });
codeSnippetSchema.index({ tags: 1 });

export default mongoose.model<ICodeSnippet>('CodeSnippet', codeSnippetSchema);


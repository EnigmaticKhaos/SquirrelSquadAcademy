import mongoose, { Document, Schema } from 'mongoose';

export type ProjectType = 'github' | 'deployed' | 'file' | 'code';

export interface IProject extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: ProjectType;
  
  // Project content
  githubRepoUrl?: string;
  deployedUrl?: string;
  files?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  codeSnippet?: string;
  language?: string;
  
  // Course/Assignment relation
  course?: mongoose.Types.ObjectId;
  assignment?: mongoose.Types.ObjectId;
  
  // Tags and categories
  tags: string[];
  category?: string;
  
  // Engagement
  likesCount: number;
  commentsCount: number;
  
  // Visibility
  isPublic: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    description: String,
    type: {
      type: String,
      enum: ['github', 'deployed', 'file', 'code'],
      required: true,
    },
    githubRepoUrl: String,
    deployedUrl: String,
    files: [{
      name: String,
      url: String,
      type: String,
    }],
    codeSnippet: String,
    language: String,
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
    },
    tags: [String],
    category: String,
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ user: 1, createdAt: -1 });
projectSchema.index({ course: 1 });
projectSchema.index({ tags: 1 });
// Text index for search (compound index for title, description, and tags)
projectSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IProject>('Project', projectSchema);


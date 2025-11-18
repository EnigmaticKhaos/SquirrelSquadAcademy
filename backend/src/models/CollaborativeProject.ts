import mongoose, { Document, Schema } from 'mongoose';

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'archived';
export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface IProjectMember extends Document {
  user: mongoose.Types.ObjectId;
  role: ProjectRole;
  joinedAt: Date;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canManageTasks: boolean;
  };
}

export interface ICollaborativeProject extends Document {
  // Project details
  title: string;
  description: string;
  course?: mongoose.Types.ObjectId;
  assignment?: mongoose.Types.ObjectId;
  
  // Team
  owner: mongoose.Types.ObjectId;
  members: IProjectMember[];
  maxMembers?: number;
  
  // Status
  status: ProjectStatus;
  
  // Tasks
  tasks: Array<{
    _id?: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    assignedTo?: mongoose.Types.ObjectId;
    status: 'todo' | 'in_progress' | 'review' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
  }>;
  
  // Resources
  resources: Array<{
    _id?: mongoose.Types.ObjectId;
    type: 'file' | 'link' | 'code_repo';
    title: string;
    url?: string;
    fileKey?: string;
    description?: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }>;
  
  // Discussion
  discussion: Array<{
    _id?: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    replies?: Array<{
      _id?: mongoose.Types.ObjectId;
      user: mongoose.Types.ObjectId;
      content: string;
      createdAt: Date;
    }>;
  }>;
  
  // Deliverables
  deliverables: Array<{
    _id?: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    type: 'file' | 'link' | 'code_repo';
    url?: string;
    fileKey?: string;
    submittedBy: mongoose.Types.ObjectId;
    submittedAt: Date;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
  }>;
  
  // Settings
  settings: {
    isPublic: boolean;
    allowMemberInvites: boolean;
    requireApprovalForJoining: boolean;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    permissions: {
      canEdit: {
        type: Boolean,
        default: true,
      },
      canDelete: {
        type: Boolean,
        default: false,
      },
      canInvite: {
        type: Boolean,
        default: false,
      },
      canManageTasks: {
        type: Boolean,
        default: true,
      },
    },
  },
  { _id: false }
);

const collaborativeProjectSchema = new Schema<ICollaborativeProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [projectMemberSchema],
    maxMembers: {
      type: Number,
      default: 10,
    },
    status: {
      type: String,
      enum: ['planning', 'in_progress', 'review', 'completed', 'archived'],
      default: 'planning',
      index: true,
    },
    tasks: [{
      title: {
        type: String,
        required: true,
      },
      description: String,
      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['todo', 'in_progress', 'review', 'completed'],
        default: 'todo',
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      dueDate: Date,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      completedAt: Date,
    }],
    resources: [{
      type: {
        type: String,
        enum: ['file', 'link', 'code_repo'],
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      url: String,
      fileKey: String,
      description: String,
      uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    discussion: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      replies: [{
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      }],
    }],
    deliverables: [{
      title: {
        type: String,
        required: true,
      },
      description: String,
      type: {
        type: String,
        enum: ['file', 'link', 'code_repo'],
        required: true,
      },
      url: String,
      fileKey: String,
      submittedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      approvedAt: Date,
    }],
    settings: {
      isPublic: {
        type: Boolean,
        default: false,
      },
      allowMemberInvites: {
        type: Boolean,
        default: true,
      },
      requireApprovalForJoining: {
        type: Boolean,
        default: false,
      },
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
collaborativeProjectSchema.index({ owner: 1, status: 1 });
collaborativeProjectSchema.index({ course: 1, status: 1 });
collaborativeProjectSchema.index({ 'members.user': 1 });
collaborativeProjectSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ICollaborativeProject>('CollaborativeProject', collaborativeProjectSchema);


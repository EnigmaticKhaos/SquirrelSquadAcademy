import mongoose, { Document, Schema } from 'mongoose';

export type SavedContentType = 'course' | 'lesson' | 'post' | 'project' | 'forum_post';

export interface ISavedContent extends Document {
  user: mongoose.Types.ObjectId;
  
  // Content reference
  contentType: SavedContentType;
  contentTypeModel: string; // For dynamic refPath
  contentId: mongoose.Types.ObjectId;
  
  // Organization
  folder?: string; // Optional folder/category name
  tags: string[];
  notes?: string; // Personal notes about the saved content
  
  // Timestamps
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const savedContentSchema = new Schema<ISavedContent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentType: {
      type: String,
      enum: ['course', 'lesson', 'post', 'project', 'forum_post'],
      required: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'contentTypeModel',
    },
    contentTypeModel: {
      type: String,
      enum: ['Course', 'Lesson', 'Post', 'Project', 'ForumPost'],
      required: true,
    },
    folder: String,
    tags: [String],
    notes: String,
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

savedContentSchema.index({ user: 1, contentType: 1, contentId: 1 }, { unique: true });
savedContentSchema.index({ user: 1, folder: 1 });
savedContentSchema.index({ user: 1, tags: 1 });
savedContentSchema.index({ user: 1, savedAt: -1 });

export default mongoose.model<ISavedContent>('SavedContent', savedContentSchema);


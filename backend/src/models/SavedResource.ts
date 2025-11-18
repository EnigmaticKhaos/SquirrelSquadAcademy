import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedResource extends Document {
  user: mongoose.Types.ObjectId;
  resource: mongoose.Types.ObjectId;
  
  // Organization
  folder?: string; // Optional folder/category for organization
  tags?: string[];
  notes?: string; // User's personal notes about the resource
  
  // Timestamps
  savedAt: Date;
  lastViewed?: Date;
  viewCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const savedResourceSchema = new Schema<ISavedResource>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resource: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    folder: String,
    tags: [String],
    notes: String,
    savedAt: {
      type: Date,
      default: Date.now,
    },
    lastViewed: Date,
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

savedResourceSchema.index({ user: 1, resource: 1 }, { unique: true });
savedResourceSchema.index({ user: 1, folder: 1 });

export default mongoose.model<ISavedResource>('SavedResource', savedResourceSchema);


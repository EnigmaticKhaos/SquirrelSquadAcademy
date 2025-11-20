import mongoose, { Document, Schema } from 'mongoose';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ExportFormat = 'json' | 'csv' | 'pdf';

export interface IDataExport extends Document {
  user: mongoose.Types.ObjectId;
  
  // Export details
  status: ExportStatus;
  format: ExportFormat;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt: Date; // Export files expire after a certain period
  
  // File information
  fileUrl?: string; // URL to download the export file
  fileSize?: number; // File size in bytes
  fileName?: string;
  
  // Export scope
  includeProfile: boolean;
  includeCourses: boolean;
  includeSocial: boolean;
  includeAnalytics: boolean;
  includeMessages: boolean;
  includeProjects: boolean;
  
  // Error handling
  errorMessage?: string;
  retryCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const dataExportSchema = new Schema<IDataExport>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    format: {
      type: String,
      enum: ['json', 'csv', 'pdf'],
      default: 'json',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
    },
    fileUrl: String,
    fileSize: Number,
    fileName: String,
    includeProfile: {
      type: Boolean,
      default: true,
    },
    includeCourses: {
      type: Boolean,
      default: true,
    },
    includeSocial: {
      type: Boolean,
      default: true,
    },
    includeAnalytics: {
      type: Boolean,
      default: true,
    },
    includeMessages: {
      type: Boolean,
      default: true,
    },
    includeProjects: {
      type: Boolean,
      default: true,
    },
    errorMessage: String,
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

dataExportSchema.index({ user: 1, status: 1 });
dataExportSchema.index({ expiresAt: 1 }); // For cleanup of expired exports

export default mongoose.model<IDataExport>('DataExport', dataExportSchema);


import mongoose, { Document, Schema } from 'mongoose';

export interface ILiveSessionRecording extends Document {
  session: mongoose.Types.ObjectId;
  
  // Recording details
  recordingUrl: string; // URL to the recording
  thumbnailUrl?: string; // Thumbnail image URL
  duration: number; // Recording duration in seconds
  
  // Metadata
  format: string; // Video format (mp4, webm, etc.)
  resolution?: string; // Video resolution (1080p, 720p, etc.)
  fileSize?: number; // File size in bytes
  
  // Access
  isPublic: boolean; // Whether recording is publicly accessible
  viewCount: number; // Number of views
  lastViewedAt?: Date; // Last time recording was viewed
  
  // Processing
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  
  // Timestamps
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const liveSessionRecordingSchema = new Schema<ILiveSessionRecording>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
      unique: true,
    },
    recordingUrl: {
      type: String,
      required: [true, 'Recording URL is required'],
    },
    thumbnailUrl: String,
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    format: {
      type: String,
      default: 'mp4',
    },
    resolution: String,
    fileSize: Number,
    isPublic: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastViewedAt: Date,
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingError: String,
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// session already has unique: true which creates an index automatically
liveSessionRecordingSchema.index({ isPublic: 1, recordedAt: -1 });

export default mongoose.model<ILiveSessionRecording>('LiveSessionRecording', liveSessionRecordingSchema);


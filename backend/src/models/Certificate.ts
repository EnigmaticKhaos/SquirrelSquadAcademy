import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  // User who earned the certificate
  user: mongoose.Types.ObjectId;
  
  // Course completion (if course-related)
  course?: mongoose.Types.ObjectId;
  courseCompletion?: mongoose.Types.ObjectId;
  
  // Certificate details
  title: string;
  description?: string;
  issuedDate: Date;
  
  // Verification
  certificateId: string; // Unique certificate ID for verification
  verificationCode: string; // Unique verification code
  shareableLink: string; // Public shareable link
  
  // Certificate data
  certificateData: {
    userName: string;
    courseName?: string;
    completionDate: Date;
    finalScore?: number;
    passed?: boolean;
    duration?: string; // Time to complete
    issuedBy: string; // Platform name
  };
  
  // PDF storage
  pdfUrl?: string; // URL to stored PDF
  pdfKey?: string; // S3 key if stored in S3
  
  // Design
  template?: string; // Certificate template name
  design?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    logoUrl?: string;
  };
  
  // Metadata
  metadata?: {
    [key: string]: any;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
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
    },
    courseCompletion: {
      type: Schema.Types.ObjectId,
      ref: 'CourseCompletion',
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    issuedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
    },
    shareableLink: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    certificateData: {
      userName: {
        type: String,
        required: true,
      },
      courseName: String,
      completionDate: {
        type: Date,
        required: true,
      },
      finalScore: Number,
      passed: Boolean,
      duration: String,
      issuedBy: {
        type: String,
        default: 'SquirrelSquad Academy',
      },
    },
    pdfUrl: String,
    pdfKey: String,
    template: {
      type: String,
      default: 'default',
    },
    design: {
      backgroundColor: String,
      textColor: String,
      borderColor: String,
      logoUrl: String,
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
certificateSchema.index({ user: 1, issuedDate: -1 });
certificateSchema.index({ course: 1 });
// certificateId and verificationCode already have unique: true which creates indexes automatically

export default mongoose.model<ICertificate>('Certificate', certificateSchema);


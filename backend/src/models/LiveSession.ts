import mongoose, { Document, Schema } from 'mongoose';

export type LiveSessionType = 'webinar' | 'workshop' | 'qna' | 'office_hours' | 'course_completion_party' | 'custom';
export type LiveSessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type LiveSessionProvider = 'webrtc' | 'zoom' | 'custom';

export interface ILiveSession extends Document {
  host: mongoose.Types.ObjectId; // User hosting the session
  coHosts?: mongoose.Types.ObjectId[]; // Additional hosts
  
  // Session details
  title: string;
  description?: string;
  sessionType: LiveSessionType;
  status: LiveSessionStatus;
  
  // Scheduling
  scheduledStartTime: Date;
  scheduledEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  duration?: number; // Actual duration in minutes
  
  // Video/Streaming
  provider: LiveSessionProvider;
  meetingUrl?: string; // Zoom/WebRTC meeting URL
  meetingId?: string; // External meeting ID (e.g., Zoom meeting ID)
  meetingPassword?: string; // Meeting password if required
  streamUrl?: string; // Live stream URL if broadcasting
  
  // Related content
  course?: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  
  // Settings
  maxParticipants?: number; // Maximum number of participants
  allowRecording: boolean; // Whether recording is allowed
  requireRegistration: boolean; // Whether users must register
  isPublic: boolean; // Whether session is visible to all users
  allowQuestions: boolean; // Whether Q&A is enabled
  allowPolls: boolean; // Whether polls are enabled
  allowScreenShare: boolean; // Whether screen sharing is allowed
  allowChat: boolean; // Whether chat is enabled
  
  // Registration
  registrationDeadline?: Date;
  registeredUsers: mongoose.Types.ObjectId[]; // Users who registered
  
  // Statistics
  totalParticipants: number; // Total number of participants
  peakParticipants: number; // Peak concurrent participants
  totalViews: number; // Total views (including recording views)
  averageWatchTime?: number; // Average watch time in minutes
  
  // Recording
  recordingUrl?: string; // URL to recording
  recordingAvailable: boolean; // Whether recording is available
  
  // Reminders
  remindersSent: boolean; // Whether reminders have been sent
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const liveSessionSchema = new Schema<ILiveSession>(
  {
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    coHosts: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
    },
    description: String,
    sessionType: {
      type: String,
      enum: ['webinar', 'workshop', 'qna', 'office_hours', 'course_completion_party', 'custom'],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    scheduledStartTime: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledEndTime: Date,
    actualStartTime: Date,
    actualEndTime: Date,
    duration: Number,
    provider: {
      type: String,
      enum: ['webrtc', 'zoom', 'custom'],
      default: 'webrtc',
    },
    meetingUrl: String,
    meetingId: String,
    meetingPassword: String,
    streamUrl: String,
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    maxParticipants: {
      type: Number,
      min: 1,
    },
    allowRecording: {
      type: Boolean,
      default: true,
    },
    requireRegistration: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowQuestions: {
      type: Boolean,
      default: true,
    },
    allowPolls: {
      type: Boolean,
      default: true,
    },
    allowScreenShare: {
      type: Boolean,
      default: true,
    },
    allowChat: {
      type: Boolean,
      default: true,
    },
    registrationDeadline: Date,
    registeredUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    totalParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },
    peakParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageWatchTime: Number,
    recordingUrl: String,
    recordingAvailable: {
      type: Boolean,
      default: false,
    },
    remindersSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

liveSessionSchema.index({ host: 1, scheduledStartTime: -1 });
liveSessionSchema.index({ status: 1, scheduledStartTime: 1 });
liveSessionSchema.index({ course: 1, scheduledStartTime: -1 });
liveSessionSchema.index({ isPublic: 1, status: 1 });

export default mongoose.model<ILiveSession>('LiveSession', liveSessionSchema);


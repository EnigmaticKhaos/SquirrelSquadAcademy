import mongoose, { Document, Schema } from 'mongoose';

export type ParticipantRole = 'host' | 'co_host' | 'participant' | 'viewer';
export type ParticipantStatus = 'registered' | 'joined' | 'left' | 'absent';

export interface ILiveSessionParticipant extends Document {
  session: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  
  // Participation details
  role: ParticipantRole;
  status: ParticipantStatus;
  
  // Join/leave tracking
  registeredAt?: Date;
  joinedAt?: Date;
  leftAt?: Date;
  duration: number; // Total time in session in seconds
  
  // Interaction
  questionsAsked: number; // Number of questions asked
  pollsAnswered: number; // Number of polls answered
  chatMessages: number; // Number of chat messages sent
  
  // Statistics
  watchTime: number; // Total watch time in seconds
  lastActiveAt?: Date; // Last active timestamp
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const liveSessionParticipantSchema = new Schema<ILiveSessionParticipant>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSession',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['host', 'co_host', 'participant', 'viewer'],
      default: 'participant',
    },
    status: {
      type: String,
      enum: ['registered', 'joined', 'left', 'absent'],
      default: 'registered',
    },
    registeredAt: Date,
    joinedAt: Date,
    leftAt: Date,
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    questionsAsked: {
      type: Number,
      default: 0,
      min: 0,
    },
    pollsAnswered: {
      type: Number,
      default: 0,
      min: 0,
    },
    chatMessages: {
      type: Number,
      default: 0,
      min: 0,
    },
    watchTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveAt: Date,
  },
  {
    timestamps: true,
  }
);

liveSessionParticipantSchema.index({ session: 1, user: 1 }, { unique: true });
liveSessionParticipantSchema.index({ session: 1, status: 1 });
liveSessionParticipantSchema.index({ user: 1, joinedAt: -1 });

export default mongoose.model<ILiveSessionParticipant>('LiveSessionParticipant', liveSessionParticipantSchema);


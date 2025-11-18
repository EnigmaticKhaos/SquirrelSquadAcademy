import mongoose, { Document, Schema } from 'mongoose';

export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'custom';
export type ReminderType = 'study' | 'flashcard_review' | 'assignment_deadline' | 'course_reminder' | 'custom';

export interface IStudyReminder extends Document {
  user: mongoose.Types.ObjectId;
  
  // Reminder details
  title: string;
  description?: string;
  reminderType: ReminderType;
  
  // Scheduling
  scheduledTime: Date; // When the reminder should fire
  frequency: ReminderFrequency;
  customDays?: number[]; // Days of week (0-6, Sunday-Saturday) for custom frequency
  customTime?: string; // Time in HH:mm format for custom frequency
  timezone?: string; // User's timezone
  
  // Related content (optional)
  course?: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  assignment?: mongoose.Types.ObjectId;
  flashcardDeck?: mongoose.Types.ObjectId;
  
  // Notification settings
  sendEmail: boolean;
  sendPush: boolean;
  sendInApp: boolean;
  
  // Status
  isActive: boolean;
  lastSent?: Date;
  nextSend?: Date;
  totalSent: number; // Number of times reminder has been sent
  
  // Completion
  completedAt?: Date;
  isCompleted: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const studyReminderSchema = new Schema<IStudyReminder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Reminder title is required'],
      trim: true,
    },
    description: String,
    reminderType: {
      type: String,
      enum: ['study', 'flashcard_review', 'assignment_deadline', 'course_reminder', 'custom'],
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
      index: true,
    },
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'custom'],
      default: 'once',
    },
    customDays: [Number], // 0-6 for days of week
    customTime: String, // HH:mm format
    timezone: String,
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
    },
    flashcardDeck: {
      type: Schema.Types.ObjectId,
      ref: 'FlashcardDeck',
    },
    sendEmail: {
      type: Boolean,
      default: true,
    },
    sendPush: {
      type: Boolean,
      default: false,
    },
    sendInApp: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastSent: Date,
    nextSend: {
      type: Date,
      index: true,
    },
    totalSent: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedAt: Date,
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

studyReminderSchema.index({ user: 1, isActive: 1, nextSend: 1 });
studyReminderSchema.index({ user: 1, reminderType: 1 });

export default mongoose.model<IStudyReminder>('StudyReminder', studyReminderSchema);


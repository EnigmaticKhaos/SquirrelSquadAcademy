import mongoose, { Document, Schema } from 'mongoose';

export type SyncActionType = 
  | 'lesson_progress'
  | 'quiz_submission'
  | 'assignment_submission'
  | 'note_create'
  | 'note_update'
  | 'note_delete'
  | 'post_create'
  | 'comment_create'
  | 'like_create'
  | 'message_send'
  | 'flashcard_review'
  | 'pomodoro_complete'
  | 'course_enrollment'
  | 'course_completion';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export interface IOfflineSyncQueue extends Document {
  user: mongoose.Types.ObjectId;
  
  // Action details
  actionType: SyncActionType;
  actionData: any; // Flexible structure for different action types
  
  // Sync metadata
  status: SyncStatus;
  retryCount: number;
  lastRetryAt?: Date;
  errorMessage?: string;
  
  // Conflict resolution
  conflictResolution?: 'server' | 'client' | 'merge';
  serverVersion?: any; // Server version if conflict occurred
  
  // Timestamps
  createdAt: Date; // When action was created offline
  syncedAt?: Date; // When action was successfully synced
  updatedAt: Date;
}

const offlineSyncQueueSchema = new Schema<IOfflineSyncQueue>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: [
        'lesson_progress',
        'quiz_submission',
        'assignment_submission',
        'note_create',
        'note_update',
        'note_delete',
        'post_create',
        'comment_create',
        'like_create',
        'message_send',
        'flashcard_review',
        'pomodoro_complete',
        'course_enrollment',
        'course_completion',
      ],
      required: true,
      index: true,
    },
    actionData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'syncing', 'synced', 'failed', 'conflict'],
      default: 'pending',
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastRetryAt: Date,
    errorMessage: String,
    conflictResolution: {
      type: String,
      enum: ['server', 'client', 'merge'],
    },
    serverVersion: Schema.Types.Mixed,
    syncedAt: Date,
  },
  {
    timestamps: true,
  }
);

offlineSyncQueueSchema.index({ user: 1, status: 1, createdAt: 1 });
offlineSyncQueueSchema.index({ status: 1, createdAt: 1 }); // For processing queue

export default mongoose.model<IOfflineSyncQueue>('OfflineSyncQueue', offlineSyncQueueSchema);


import OfflineSyncQueue, { SyncActionType } from '../models/OfflineSyncQueue';
import Note from '../models/Note';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Like from '../models/Like';
import Message from '../models/Message';
import FlashcardReview from '../models/FlashcardReview';
import PomodoroSession from '../models/PomodoroSession';
import CourseEnrollment from '../models/CourseEnrollment';
import CourseCompletion from '../models/CourseCompletion';
import VideoProgress from '../models/VideoProgress';
import Submission from '../models/Submission';
import logger from '../utils/logger';

/**
 * Add action to offline sync queue
 */
export const queueOfflineAction = async (
  userId: string,
  actionType: SyncActionType,
  actionData: any
): Promise<any> => {
  try {
    const queueItem = await OfflineSyncQueue.create({
      user: userId,
      actionType,
      actionData,
      status: 'pending',
    });

    logger.info(`Offline action queued: ${actionType} for user ${userId}`);
    return queueItem;
  } catch (error) {
    logger.error('Error queueing offline action:', error);
    throw error;
  }
};

/**
 * Process offline sync queue for user
 */
export const syncOfflineActions = async (userId: string): Promise<{
  synced: number;
  failed: number;
  conflicts: number;
}> => {
  try {
    const pendingActions = await OfflineSyncQueue.find({
      user: userId,
      status: { $in: ['pending', 'failed'] },
    }).sort({ createdAt: 1 });

    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    for (const action of pendingActions) {
      try {
        action.status = 'syncing';
        await action.save();

        // Process based on action type
        await processSyncAction(action);

        action.status = 'synced';
        action.syncedAt = new Date();
        action.retryCount = 0;
        await action.save();

        synced++;
      } catch (error: any) {
        action.retryCount += 1;
        action.lastRetryAt = new Date();
        action.errorMessage = error.message;

        // Check for conflicts
        if (error.name === 'ConflictError' || error.message.includes('conflict')) {
          action.status = 'conflict';
          conflicts++;
        } else if (action.retryCount >= 3) {
          action.status = 'failed';
          failed++;
        } else {
          action.status = 'pending';
        }

        await action.save();
        logger.error(`Error syncing action ${action._id}:`, error);
      }
    }

    logger.info(`Sync completed for user ${userId}: ${synced} synced, ${failed} failed, ${conflicts} conflicts`);
    return { synced, failed, conflicts };
  } catch (error) {
    logger.error('Error syncing offline actions:', error);
    throw error;
  }
};

/**
 * Process individual sync action
 */
const processSyncAction = async (action: any): Promise<void> => {
  const { actionType, actionData, user } = action;

  switch (actionType) {
    case 'note_create':
    case 'note_update':
      await processNoteAction(actionType, actionData, user);
      break;

    case 'note_delete':
      await Note.findByIdAndDelete(actionData.noteId);
      break;

    case 'post_create':
      await Post.create({
        ...actionData,
        author: user,
      });
      break;

    case 'comment_create':
      await Comment.create({
        ...actionData,
        author: user,
      });
      break;

    case 'like_create':
      // Check if like already exists
      const existingLike = await Like.findOne({
        user,
        [actionData.targetType]: actionData.targetId,
      });
      if (!existingLike) {
        await Like.create({
          user,
          [actionData.targetType]: actionData.targetId,
        });
      }
      break;

    case 'message_send':
      await Message.create({
        ...actionData,
        sender: user,
      });
      break;

    case 'flashcard_review':
      await FlashcardReview.create({
        ...actionData,
        user,
      });
      break;

    case 'pomodoro_complete':
      if (actionData.sessionId) {
        await PomodoroSession.findByIdAndUpdate(actionData.sessionId, {
          status: 'completed',
          completedAt: new Date(),
        });
      }
      break;

    case 'lesson_progress':
      await VideoProgress.findOneAndUpdate(
        {
          user,
          lesson: actionData.lessonId,
        },
        {
          user,
          lesson: actionData.lessonId,
          currentTime: actionData.currentTime,
          duration: actionData.duration,
          progressPercentage: actionData.progressPercentage,
          completed: actionData.completed || false,
        },
        { upsert: true, new: true }
      );
      break;

    case 'quiz_submission':
      // Quiz submissions are typically handled as regular submissions
      await Submission.create({
        ...actionData,
        user,
        submissionType: 'quiz',
      });
      break;

    case 'assignment_submission':
      await Submission.create({
        ...actionData,
        user,
      });
      break;

    case 'course_enrollment':
      await CourseEnrollment.create({
        ...actionData,
        user,
      });
      break;

    case 'course_completion':
      await CourseCompletion.create({
        ...actionData,
        user,
      });
      break;

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
};

/**
 * Process note action (create/update)
 */
const processNoteAction = async (
  actionType: 'note_create' | 'note_update',
  actionData: any,
  userId: any
): Promise<void> => {
  if (actionType === 'note_create') {
    await Note.create({
      ...actionData,
      user: userId,
    });
  } else if (actionType === 'note_update') {
    await Note.findByIdAndUpdate(actionData.noteId, {
      content: actionData.content,
      updatedAt: new Date(),
    });
  }
};

/**
 * Get user's pending sync actions
 */
export const getPendingSyncActions = async (userId: string): Promise<any[]> => {
  try {
    const actions = await OfflineSyncQueue.find({
      user: userId,
      status: { $in: ['pending', 'failed', 'conflict'] },
    }).sort({ createdAt: 1 });

    return actions;
  } catch (error) {
    logger.error('Error fetching pending sync actions:', error);
    return [];
  }
};

/**
 * Resolve sync conflict
 */
export const resolveSyncConflict = async (
  actionId: string,
  resolution: 'server' | 'client' | 'merge',
  clientData?: any
): Promise<any> => {
  try {
    const action = await OfflineSyncQueue.findById(actionId);

    if (!action) {
      throw new Error('Sync action not found');
    }

    if (action.status !== 'conflict') {
      throw new Error('Action is not in conflict state');
    }

    action.conflictResolution = resolution;

    if (resolution === 'client' && clientData) {
      action.actionData = clientData;
    } else if (resolution === 'merge' && clientData) {
      // Merge server and client data (simplified - can be enhanced)
      action.actionData = {
        ...action.serverVersion,
        ...clientData,
      };
    }

    // Retry sync
    action.status = 'pending';
    await action.save();

    // Process sync
    await syncOfflineActions(action.user.toString());

    return action;
  } catch (error) {
    logger.error('Error resolving sync conflict:', error);
    throw error;
  }
};

/**
 * Clear synced actions (cleanup)
 */
export const clearSyncedActions = async (userId: string, olderThanDays: number = 7): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await OfflineSyncQueue.deleteMany({
      user: userId,
      status: 'synced',
      syncedAt: { $lt: cutoffDate },
    });

    logger.info(`Cleared ${result.deletedCount} synced actions for user ${userId}`);
    return result.deletedCount || 0;
  } catch (error) {
    logger.error('Error clearing synced actions:', error);
    return 0;
  }
};


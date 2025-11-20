import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { IUser } from '../models/User';
import {
  startPomodoroSession,
  pausePomodoroSession,
  resumePomodoroSession,
  completePomodoroSession,
  endPomodoroSession,
  getActiveSession,
  getSessionHistory,
  getPomodoroStatistics,
} from '../services/pomodoroService';
import {
  createStudyReminder,
  updateStudyReminder,
  deleteStudyReminder,
} from '../services/studyReminderService';
import {
  createResource,
  saveResource,
  unsaveResource,
  getSavedResources,
  trackResourceView,
} from '../services/resourceService';
import StudyReminder from '../models/StudyReminder';
import Resource from '../models/Resource';
import SavedResource from '../models/SavedResource';

// ========== Pomodoro Timer ==========

// @desc    Get active Pomodoro session
// @route   GET /api/study-tools/pomodoro/active
// @access  Private
export const getActivePomodoro = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const session = await getActiveSession(userId);

  res.json({
    success: true,
    session,
  });
});

// @desc    Start Pomodoro session
// @route   POST /api/study-tools/pomodoro/start
// @access  Private
export const startPomodoro = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const {
    workDuration,
    shortBreakDuration,
    longBreakDuration,
    longBreakInterval,
    courseId,
    lessonId,
    activityType,
  } = req.body;

  const session = await startPomodoroSession(userId, {
    workDuration,
    shortBreakDuration,
    longBreakDuration,
    longBreakInterval,
    courseId,
    lessonId,
    activityType,
  });

  res.status(201).json({
    success: true,
    session,
  });
});

// @desc    Pause Pomodoro session
// @route   POST /api/study-tools/pomodoro/:id/pause
// @access  Private
export const pausePomodoro = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  const session = await pausePomodoroSession(id, userId);

  res.json({
    success: true,
    session,
  });
});

// @desc    Resume Pomodoro session
// @route   POST /api/study-tools/pomodoro/:id/resume
// @access  Private
export const resumePomodoro = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  const session = await resumePomodoroSession(id, userId);

  res.json({
    success: true,
    session,
  });
});

// @desc    Complete Pomodoro session (work/break)
// @route   POST /api/study-tools/pomodoro/:id/complete
// @access  Private
export const completePomodoro = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  const session = await completePomodoroSession(id, userId);

  res.json({
    success: true,
    session,
  });
});

// @desc    End Pomodoro session completely
// @route   POST /api/study-tools/pomodoro/:id/end
// @access  Private
export const endPomodoro = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  const session = await endPomodoroSession(id, userId);

  res.json({
    success: true,
    session,
  });
});

// @desc    Get Pomodoro session history
// @route   GET /api/study-tools/pomodoro/history
// @access  Private
export const getPomodoroHistory = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { limit } = req.query;

  const sessions = await getSessionHistory(
    userId,
    limit ? parseInt(limit as string) : 20
  );

  res.json({
    success: true,
    sessions,
  });
});

// @desc    Get Pomodoro statistics
// @route   GET /api/study-tools/pomodoro/statistics
// @access  Private
export const getPomodoroStats = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const stats = await getPomodoroStatistics(userId);

  res.json({
    success: true,
    statistics: stats,
  });
});

// ========== Study Reminders ==========

// @desc    Get user's study reminders
// @route   GET /api/study-tools/reminders
// @access  Private
export const getReminders = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { active, type } = req.query;

  const query: any = { user: userId };
  if (active !== undefined) {
    query.isActive = active === 'true';
  }
  if (type) {
    query.reminderType = type;
  }

  const reminders = await StudyReminder.find(query)
    .sort({ scheduledTime: 1 })
    .populate('course', 'title')
    .populate('lesson', 'title')
    .populate('assignment', 'title')
    .populate('flashcardDeck', 'title');

  res.json({
    success: true,
    reminders,
  });
});

// @desc    Create study reminder
// @route   POST /api/study-tools/reminders
// @access  Private
export const createReminder = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const reminder = await createStudyReminder(userId, req.body);

  res.status(201).json({
    success: true,
    reminder,
  });
});

// @desc    Update study reminder
// @route   PUT /api/study-tools/reminders/:id
// @access  Private
export const updateReminder = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  const reminder = await updateStudyReminder(id, userId, req.body);

  res.json({
    success: true,
    reminder,
  });
});

// @desc    Delete study reminder
// @route   DELETE /api/study-tools/reminders/:id
// @access  Private
export const deleteReminder = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  await deleteStudyReminder(id, userId);

  res.json({
    success: true,
    message: 'Reminder deleted successfully',
  });
});

// ========== Resource Library ==========

// @desc    Get resources
// @route   GET /api/study-tools/resources
// @access  Private
export const getResources = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { type, category, search, public: publicOnly, featured } = req.query;

  const query: any = {};
  
  if (publicOnly === 'true') {
    query.isPublic = true;
    query.isArchived = false;
  } else {
    // User can see their own resources and public resources
    query.$or = [
      { user: userId },
      { isPublic: true, isArchived: false },
    ];
  }

  if (type) {
    query.resourceType = type;
  }
  if (category) {
    query.category = category;
  }
  if (featured === 'true') {
    query.isFeatured = true;
  }
  if (search) {
    query.$text = { $search: search as string };
  }

  const resources = await Resource.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('course', 'title')
    .populate('lesson', 'title');

  res.json({
    success: true,
    resources,
  });
});

// @desc    Create resource
// @route   POST /api/study-tools/resources
// @access  Private
export const createResourceHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId; role?: string };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const isAdmin = userDoc.role === 'admin';

  const resource = await createResource(userId, req.body, isAdmin);

  res.status(201).json({
    success: true,
    resource,
  });
});

// @desc    Get saved resources
// @route   GET /api/study-tools/resources/saved
// @access  Private
export const getSavedResourcesHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { folder } = req.query;

  const savedResources = await getSavedResources(userId, folder as string);

  res.json({
    success: true,
    savedResources,
  });
});

// @desc    Save resource
// @route   POST /api/study-tools/resources/:id/save
// @access  Private
export const saveResourceHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;
  const { folder, tags, notes } = req.body;

  const savedResource = await saveResource(userId, id, folder, tags, notes);

  res.json({
    success: true,
    savedResource,
  });
});

// @desc    Unsave resource
// @route   DELETE /api/study-tools/resources/:id/save
// @access  Private
export const unsaveResourceHandler = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  await unsaveResource(userId, id);

  res.json({
    success: true,
    message: 'Resource unsaved successfully',
  });
});

// @desc    Track resource view
// @route   POST /api/study-tools/resources/:id/view
// @access  Private
export const viewResource = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  await trackResourceView(id, userId);

  res.json({
    success: true,
    message: 'View tracked',
  });
});


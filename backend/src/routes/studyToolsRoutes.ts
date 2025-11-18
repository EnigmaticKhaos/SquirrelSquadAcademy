import express from 'express';
import { protect } from '../middleware/auth';
import {
  getActivePomodoro,
  startPomodoro,
  pausePomodoro,
  resumePomodoro,
  completePomodoro,
  endPomodoro,
  getPomodoroHistory,
  getPomodoroStats,
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getResources,
  createResourceHandler,
  getSavedResourcesHandler,
  saveResourceHandler,
  unsaveResourceHandler,
  viewResource,
} from '../controllers/studyToolsController';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Pomodoro Timer
router.get('/pomodoro/active', getActivePomodoro);
router.post('/pomodoro/start', startPomodoro);
router.post('/pomodoro/:id/pause', pausePomodoro);
router.post('/pomodoro/:id/resume', resumePomodoro);
router.post('/pomodoro/:id/complete', completePomodoro);
router.post('/pomodoro/:id/end', endPomodoro);
router.get('/pomodoro/history', getPomodoroHistory);
router.get('/pomodoro/statistics', getPomodoroStats);

// Study Reminders
router.get('/reminders', getReminders);
router.post('/reminders', createReminder);
router.put('/reminders/:id', updateReminder);
router.delete('/reminders/:id', deleteReminder);

// Resource Library
router.get('/resources', getResources);
router.post('/resources', createResourceHandler);
router.get('/resources/saved', getSavedResourcesHandler);
router.post('/resources/:id/save', saveResourceHandler);
router.delete('/resources/:id/save', unsaveResourceHandler);
router.post('/resources/:id/view', viewResource);

export default router;


import express from 'express';
import {
  create,
  getPosts,
  getOne,
  getReplies,
  update,
  remove,
  vote,
  markAnswer,
  pin,
  lock,
  getActivity,
} from '../controllers/forumController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/:courseId/posts', getPosts);
router.get('/posts/:id', getOne);
router.get('/posts/:id/replies', getReplies);

// Private routes
router.get('/activity', protect, getActivity);
router.post('/:courseId/posts', protect, create);
router.put('/posts/:id', protect, update);
router.delete('/posts/:id', protect, remove);
router.post('/posts/:id/vote', protect, vote);
router.post('/posts/:id/mark-answer', protect, markAnswer);

// Admin routes
router.post('/posts/:id/pin', protect, authorize('admin'), pin);
router.post('/posts/:id/lock', protect, authorize('admin'), lock);

export default router;


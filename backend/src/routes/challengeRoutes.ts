import express from 'express';
import {
  getChallenges,
  getChallenge,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  joinChallengeRoute,
  leaveChallenge,
  getUserChallenges,
  getLeaderboard,
  getChallengeProgress,
  updateProgress,
  updateStatuses,
} from '../controllers/challengeController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getChallenges);
router.get('/:id', getChallenge);
router.get('/:id/leaderboard', getLeaderboard);
router.get('/user/:userId', getUserChallenges);

// Private routes
router.post('/:id/join', protect, joinChallengeRoute);
router.delete('/:id/leave', protect, leaveChallenge);
router.get('/:id/progress', protect, getChallengeProgress);
router.post('/:id/update-progress', protect, updateProgress);

// Admin routes
router.post('/', protect, authorize('admin'), createChallenge);
router.put('/:id', protect, authorize('admin'), updateChallenge);
router.delete('/:id', protect, authorize('admin'), deleteChallenge);
router.post('/update-statuses', protect, authorize('admin'), updateStatuses);

export default router;


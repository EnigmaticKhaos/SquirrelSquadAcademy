import express from 'express';
import {
  getLeaderboard,
  getUserLeaderboardRank,
} from '../controllers/leaderboardController';

const router = express.Router();

// Public routes
router.get('/:type', getLeaderboard);
router.get('/:type/rank', getUserLeaderboardRank);

export default router;


import express from 'express';
import { protect } from '../middleware/auth';
import {
  getComments,
  createComment,
  likeComment,
  deleteComment,
} from '../controllers/commentController';

const router = express.Router({ mergeParams: true });

router.get('/', getComments);
router.post('/', protect, createComment);
router.post('/:id/like', protect, likeComment);
router.delete('/:id', protect, deleteComment);

export default router;


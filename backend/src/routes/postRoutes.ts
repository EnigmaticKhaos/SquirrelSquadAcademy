import express from 'express';
import { protect } from '../middleware/auth';
import {
  getPosts,
  getPost,
  createPost,
  likePost,
  deletePost,
} from '../controllers/postController';
import commentRoutes from './commentRoutes';

const router = express.Router({ mergeParams: true });

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', protect, createPost);
router.post('/:id/like', protect, likePost);
router.delete('/:id', protect, deletePost);

// Comment routes
router.use('/:postId/comments', commentRoutes);

export default router;


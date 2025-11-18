import express from 'express';
import {
  create,
  update,
  remove,
  getByCourse,
  getByUser,
  vote,
  addWishlist,
  removeWishlist,
  checkWishlist,
  getWishlist,
} from '../controllers/courseReviewController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/course/:courseId', getByCourse);

// Private routes
router.get('/wishlist', protect, getWishlist);
router.get('/wishlist/:courseId/check', protect, checkWishlist);
router.get('/course/:courseId/user', protect, getByUser);
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);
router.post('/:id/vote', protect, vote);
router.post('/wishlist/:courseId', protect, addWishlist);
router.delete('/wishlist/:courseId', protect, removeWishlist);

export default router;


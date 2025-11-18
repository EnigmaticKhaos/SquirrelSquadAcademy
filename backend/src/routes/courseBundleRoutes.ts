import express from 'express';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
  purchase,
  checkOwnership,
  getUserPurchases,
  updatePurchaseStatus,
  createFromLearningPath,
  getSuggestions,
  getRelated,
  getCommonlyPurchased,
  getAISuggestions,
  orderCourses,
} from '../controllers/courseBundleController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getAll);
router.post('/ai-suggestions', getAISuggestions);
router.get('/suggestions/:courseId', getSuggestions);
router.get('/related/:courseId', getRelated);
router.get('/commonly-purchased/:courseId', getCommonlyPurchased);
router.get('/:id', getOne);

// Private routes
router.get('/user/purchases', protect, getUserPurchases);
router.get('/:id/owns', protect, checkOwnership);
router.post('/:id/purchase', protect, purchase);

// Admin routes
router.post('/', protect, authorize('admin'), create);
router.post('/from-learning-path/:pathId', protect, authorize('admin'), createFromLearningPath);
router.post('/order-courses', protect, authorize('admin'), orderCourses);
router.put('/:id', protect, authorize('admin'), update);
router.delete('/:id', protect, authorize('admin'), remove);
router.put('/purchases/:id/status', protect, authorize('admin'), updatePurchaseStatus);

export default router;


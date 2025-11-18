import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
} from '../controllers/moduleController';

const router = express.Router({ mergeParams: true });

router.get('/', getModules);
router.get('/:id', getModule);
router.post('/', protect, authorize('admin'), createModule);
router.put('/:id', protect, authorize('admin'), updateModule);
router.delete('/:id', protect, authorize('admin'), deleteModule);

export default router;


import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getRubrics,
  getRubric,
  createRubric,
  updateRubric,
  deleteRubric,
} from '../controllers/rubricController';

const router = express.Router();

router.get('/', getRubrics);
router.get('/:id', getRubric);
router.post('/', protect, authorize('admin'), createRubric);
router.put('/:id', protect, authorize('admin'), updateRubric);
router.delete('/:id', protect, authorize('admin'), deleteRubric);

export default router;


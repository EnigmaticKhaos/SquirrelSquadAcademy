import express from 'express';
import {
  save,
  unsave,
  check,
  getAll,
  getByType,
  update,
  getFolders,
  getTags,
  getStats,
} from '../controllers/savedContentController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/folders', getFolders);
router.get('/tags', getTags);
router.get('/stats', getStats);
router.get('/check/:contentType/:contentId', check);
router.get('/:contentType', getByType);
router.get('/', getAll);
router.post('/', save);
router.put('/:id', update);
router.delete('/:contentType/:contentId', unsave);

export default router;


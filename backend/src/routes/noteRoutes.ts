import express from 'express';
import {
  create,
  update,
  remove,
  getByLesson,
  getByCourse,
  getAll,
  getOne,
  getTags,
  search,
  togglePin,
} from '../controllers/noteController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/tags', getTags);
router.get('/search', search);
router.get('/lesson/:lessonId', getByLesson);
router.get('/course/:courseId', getByCourse);
router.get('/:id', getOne);
router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/pin', togglePin);

export default router;


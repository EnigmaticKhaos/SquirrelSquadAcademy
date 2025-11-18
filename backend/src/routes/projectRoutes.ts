import express from 'express';
import { protect } from '../middleware/auth';
import {
  getProjects,
  getProject,
  createProject,
  likeProject,
} from '../controllers/projectController';

const router = express.Router();

router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', protect, createProject);
router.post('/:id/like', protect, likeProject);

export default router;


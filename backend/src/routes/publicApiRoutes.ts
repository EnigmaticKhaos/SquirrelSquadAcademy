import express from 'express';
import { authenticateApiKey, requirePermission } from '../middleware/apiKeyAuth';
import {
  getPublicCourses,
  getPublicCourse,
  getPublicCourseModules,
  getPublicCourseStats,
} from '../controllers/publicApiController';

const router = express.Router();

// All routes require API key authentication
router.use(authenticateApiKey);

// All routes require courses:read permission
router.use(requirePermission('courses:read'));

router.get('/courses', getPublicCourses);
router.get('/courses/:id', getPublicCourse);
router.get('/courses/:id/modules', getPublicCourseModules);
router.get('/courses/:id/stats', getPublicCourseStats);

export default router;


import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getEnrolledCourses,
  publishCourse,
  setComingSoon,
  startTestSession,
  getTestSession,
  validateCourseEndpoint,
} from '../controllers/courseController';
import moduleRoutes from './moduleRoutes';
import lessonRoutes from './lessonRoutes';

const router = express.Router();

router.get('/', getCourses);
router.get('/enrolled', protect, getEnrolledCourses);
router.get('/:id', getCourse);
router.post('/:id/enroll', protect, enrollInCourse);

// Nested routes
router.use('/:courseId/modules', moduleRoutes);
router.use('/modules/:moduleId/lessons', lessonRoutes);

// Admin routes
router.post('/', protect, authorize('admin'), createCourse);
router.put('/:id', protect, authorize('admin'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);
router.post('/:id/publish', protect, authorize('admin'), publishCourse);
router.post('/:id/coming-soon', protect, authorize('admin'), setComingSoon);
router.get('/:id/validate', protect, authorize('admin'), validateCourseEndpoint);
router.post('/:id/test/start', protect, authorize('admin'), startTestSession);
router.get('/:id/test', protect, authorize('admin'), getTestSession);

export default router;


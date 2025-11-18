import express from 'express';
import {
  globalSearch,
  searchUsers,
  searchCourses,
  searchPosts,
  searchComments,
  searchLessons,
  searchProjects,
} from '../controllers/searchController';

const router = express.Router();

// Global search
router.get('/', globalSearch);

// Specific search endpoints
router.get('/users', searchUsers);
router.get('/courses', searchCourses);
router.get('/posts', searchPosts);
router.get('/comments', searchComments);
router.get('/lessons', searchLessons);
router.get('/projects', searchProjects);

export default router;


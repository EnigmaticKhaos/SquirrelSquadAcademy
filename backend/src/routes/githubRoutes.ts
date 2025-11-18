import express from 'express';
import { protect } from '../middleware/auth';
import {
  checkGitHubStatus,
  getUserRepositories,
  createRepository,
  createAssignmentRepository,
  linkRepository,
  getRepositoryContents,
  getRepositoryFile,
  getRepositoryCommits,
  getRepositoryCommit,
  getRepositoryCode,
} from '../controllers/githubController';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GitHub status
router.get('/status', checkGitHubStatus);

// User repositories
router.get('/repos', getUserRepositories);
router.post('/repos', createRepository);

// Assignment repositories
router.post('/assignments/:id/repo', createAssignmentRepository);
router.post('/assignments/:id/link', linkRepository);

// Repository operations
router.get('/repos/:owner/:repo/contents', getRepositoryContents);
router.get('/repos/:owner/:repo/files/*', getRepositoryFile);
router.get('/repos/:owner/:repo/commits', getRepositoryCommits);
router.get('/repos/:owner/:repo/commits/:sha', getRepositoryCommit);
router.get('/repos/:owner/:repo/code', getRepositoryCode);

export default router;


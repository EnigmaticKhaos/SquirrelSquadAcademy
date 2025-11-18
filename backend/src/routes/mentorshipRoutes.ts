import express from 'express';
import {
  findMentors,
  createMentorshipRequest,
  respondToRequest,
  getRequests,
  getMentorships,
  getMentorship,
  addSession,
  createMilestone,
  completeMilestoneHandler,
  completeMentorshipHandler,
} from '../controllers/mentorshipController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/find-mentors', findMentors);
router.get('/requests', getRequests);
router.post('/requests', createMentorshipRequest);
router.put('/requests/:id/respond', respondToRequest);
router.get('/', getMentorships);
router.get('/:id', getMentorship);
router.post('/:id/sessions', addSession);
router.post('/:id/milestones', createMilestone);
router.put('/:id/milestones/:milestoneId/complete', completeMilestoneHandler);
router.post('/:id/complete', completeMentorshipHandler);

export default router;


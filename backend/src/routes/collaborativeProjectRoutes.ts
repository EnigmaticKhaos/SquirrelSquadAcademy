import express from 'express';
import {
  createCollaborativeProject,
  getProjects,
  getProjectById,
  updateCollaborativeProject,
  inviteUserToProject,
  joinCollaborativeProject,
  leaveCollaborativeProject,
  addProjectTask,
  updateProjectTask,
  addProjectDiscussion,
  addProjectResource,
  submitProjectDeliverable,
} from '../controllers/collaborativeProjectController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', createCollaborativeProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateCollaborativeProject);
router.post('/:id/invite', inviteUserToProject);
router.post('/:id/join', joinCollaborativeProject);
router.post('/:id/leave', leaveCollaborativeProject);
router.post('/:id/tasks', addProjectTask);
router.put('/:id/tasks/:taskId', updateProjectTask);
router.post('/:id/discussion', addProjectDiscussion);
router.post('/:id/resources', addProjectResource);
router.post('/:id/deliverables', submitProjectDeliverable);

export default router;


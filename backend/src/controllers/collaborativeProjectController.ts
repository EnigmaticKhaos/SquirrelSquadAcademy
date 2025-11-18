import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import {
  createProject,
  inviteUser,
  joinProject,
  leaveProject,
  updateProject,
  addTask,
  updateTask,
  addDiscussionMessage,
  addResource,
  submitDeliverable,
  getUserProjects,
  getProject,
} from '../services/collaborativeProjectService';

// @desc    Create collaborative project
// @route   POST /api/projects/collaborative
// @access  Private
export const createCollaborativeProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { title, description, courseId, assignmentId, maxMembers, settings } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Title and description are required',
    });
  }

  const project = await createProject(userId, {
    title,
    description,
    courseId,
    assignmentId,
    maxMembers,
    settings,
  });

  res.status(201).json({
    success: true,
    message: 'Collaborative project created successfully',
    project,
  });
});

// @desc    Get user projects
// @route   GET /api/projects/collaborative
// @access  Private
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { status, courseId, limit = 50, offset = 0 } = req.query;

  const { projects, total } = await getUserProjects(userId, {
    status: status as any,
    courseId: courseId as string,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: projects.length,
    total,
    projects,
  });
});

// @desc    Get single project
// @route   GET /api/projects/collaborative/:id
// @access  Private
export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const project = await getProject(id, userId);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found or access denied',
    });
  }

  res.json({
    success: true,
    project,
  });
});

// @desc    Update project
// @route   PUT /api/projects/collaborative/:id
// @access  Private
export const updateCollaborativeProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const updates = req.body;

  const project = await updateProject(id, userId, updates);

  res.json({
    success: true,
    message: 'Project updated successfully',
    project,
  });
});

// @desc    Invite user to project
// @route   POST /api/projects/collaborative/:id/invite
// @access  Private
export const inviteUserToProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const inviterId = req.user._id.toString();
  const { userId, role } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }

  await inviteUser(id, inviterId, userId, role);

  res.json({
    success: true,
    message: 'User invited successfully',
  });
});

// @desc    Join project
// @route   POST /api/projects/collaborative/:id/join
// @access  Private
export const joinCollaborativeProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const project = await joinProject(id, userId);

  res.json({
    success: true,
    message: 'Joined project successfully',
    project,
  });
});

// @desc    Leave project
// @route   POST /api/projects/collaborative/:id/leave
// @access  Private
export const leaveCollaborativeProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  await leaveProject(id, userId);

  res.json({
    success: true,
    message: 'Left project successfully',
  });
});

// @desc    Add task
// @route   POST /api/projects/collaborative/:id/tasks
// @access  Private
export const addProjectTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { title, description, assignedTo, priority, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Task title is required',
    });
  }

  const project = await addTask(id, userId, {
    title,
    description,
    assignedTo,
    priority,
    dueDate: dueDate ? new Date(dueDate) : undefined,
  });

  res.status(201).json({
    success: true,
    message: 'Task added successfully',
    project,
  });
});

// @desc    Update task
// @route   PUT /api/projects/collaborative/:id/tasks/:taskId
// @access  Private
export const updateProjectTask = asyncHandler(async (req: Request, res: Response) => {
  const { id, taskId } = req.params;
  const userId = req.user._id.toString();
  const updates = req.body;

  const project = await updateTask(id, taskId, userId, {
    ...updates,
    dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
  });

  res.json({
    success: true,
    message: 'Task updated successfully',
    project,
  });
});

// @desc    Add discussion message
// @route   POST /api/projects/collaborative/:id/discussion
// @access  Private
export const addProjectDiscussion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { content, replyToId } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Message content is required',
    });
  }

  const project = await addDiscussionMessage(id, userId, content, replyToId);

  res.status(201).json({
    success: true,
    message: 'Message added successfully',
    project,
  });
});

// @desc    Add resource
// @route   POST /api/projects/collaborative/:id/resources
// @access  Private
export const addProjectResource = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { type, title, url, fileKey, description } = req.body;

  if (!type || !title) {
    return res.status(400).json({
      success: false,
      message: 'Resource type and title are required',
    });
  }

  const project = await addResource(id, userId, {
    type,
    title,
    url,
    fileKey,
    description,
  });

  res.status(201).json({
    success: true,
    message: 'Resource added successfully',
    project,
  });
});

// @desc    Submit deliverable
// @route   POST /api/projects/collaborative/:id/deliverables
// @access  Private
export const submitProjectDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id.toString();
  const { title, description, type, url, fileKey } = req.body;

  if (!title || !type) {
    return res.status(400).json({
      success: false,
      message: 'Deliverable title and type are required',
    });
  }

  const project = await submitDeliverable(id, userId, {
    title,
    description,
    type,
    url,
    fileKey,
  });

  res.status(201).json({
    success: true,
    message: 'Deliverable submitted successfully',
    project,
  });
});


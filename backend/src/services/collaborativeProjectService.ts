import CollaborativeProject, { ProjectStatus, ProjectRole } from '../models/CollaborativeProject';
import User from '../models/User';
import Course from '../models/Course';
import Assignment from '../models/Assignment';
import { createNotification } from './notificationService';
import logger from '../utils/logger';

/**
 * Create collaborative project
 */
export const createProject = async (
  ownerId: string,
  data: {
    title: string;
    description: string;
    courseId?: string;
    assignmentId?: string;
    maxMembers?: number;
    settings?: {
      isPublic?: boolean;
      allowMemberInvites?: boolean;
      requireApprovalForJoining?: boolean;
    };
  }
): Promise<CollaborativeProject> => {
  try {
    // Verify course/assignment if provided
    if (data.courseId) {
      const course = await Course.findById(data.courseId);
      if (!course) {
        throw new Error('Course not found');
      }
    }

    if (data.assignmentId) {
      const assignment = await Assignment.findById(data.assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }
    }

    // Create project with owner as first member
    const project = await CollaborativeProject.create({
      title: data.title,
      description: data.description,
      course: data.courseId,
      assignment: data.assignmentId,
      owner: ownerId,
      members: [{
        user: ownerId as any,
        role: 'owner',
        joinedAt: new Date(),
        permissions: {
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageTasks: true,
        },
      }],
      maxMembers: data.maxMembers || 10,
      status: 'planning',
      settings: {
        isPublic: data.settings?.isPublic || false,
        allowMemberInvites: data.settings?.allowMemberInvites ?? true,
        requireApprovalForJoining: data.settings?.requireApprovalForJoining || false,
      },
    });

    logger.info(`Collaborative project created: ${project._id} by user ${ownerId}`);
    return project;
  } catch (error) {
    logger.error('Error creating collaborative project:', error);
    throw error;
  }
};

/**
 * Invite user to project
 */
export const inviteUser = async (
  projectId: string,
  inviterId: string,
  userId: string,
  role: ProjectRole = 'member'
): Promise<void> => {
  try {
    const project = await CollaborativeProject.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if inviter has permission
    const inviter = project.members.find(m => m.user.toString() === inviterId);
    if (!inviter || (!inviter.permissions.canInvite && inviter.role !== 'owner' && inviter.role !== 'admin')) {
      throw new Error('You do not have permission to invite members');
    }

    // Check if user is already a member
    if (project.members.some(m => m.user.toString() === userId)) {
      throw new Error('User is already a member of this project');
    }

    // Check max members
    if (project.maxMembers && project.members.length >= project.maxMembers) {
      throw new Error('Project has reached maximum member limit');
    }

    // Add member
    project.members.push({
      user: userId as any,
      role,
      joinedAt: new Date(),
      permissions: {
        canEdit: role === 'owner' || role === 'admin' || role === 'member',
        canDelete: role === 'owner' || role === 'admin',
        canInvite: role === 'owner' || role === 'admin',
        canManageTasks: role !== 'viewer',
      },
    });

    await project.save();

    // Send notification
    await createNotification(userId, 'system_announcement', {
      title: 'Project Invitation',
      message: `You've been invited to join the project: ${project.title}`,
      actionUrl: `/projects/${projectId}`,
      relatedUser: inviterId,
      sendEmail: true,
    });

    logger.info(`User ${userId} invited to project ${projectId}`);
  } catch (error) {
    logger.error('Error inviting user to project:', error);
    throw error;
  }
};

/**
 * Join project
 */
export const joinProject = async (
  projectId: string,
  userId: string
): Promise<CollaborativeProject> => {
  try {
    const project = await CollaborativeProject.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if project requires approval
    if (project.settings.requireApprovalForJoining && project.owner.toString() !== userId) {
      // Send notification to owner for approval
      await createNotification(project.owner.toString(), 'system_announcement', {
        title: 'Project Join Request',
        message: `A user wants to join your project: ${project.title}`,
        actionUrl: `/projects/${projectId}/members`,
        relatedUser: userId,
        sendEmail: true,
      });
      throw new Error('Join request sent. Waiting for approval.');
    }

    // Check if already a member
    if (project.members.some(m => m.user.toString() === userId)) {
      throw new Error('You are already a member of this project');
    }

    // Check max members
    if (project.maxMembers && project.members.length >= project.maxMembers) {
      throw new Error('Project has reached maximum member limit');
    }

    // Add member
    project.members.push({
      user: userId as any,
      role: 'member',
      joinedAt: new Date(),
      permissions: {
        canEdit: true,
        canDelete: false,
        canInvite: false,
        canManageTasks: true,
      },
    });

    await project.save();

    logger.info(`User ${userId} joined project ${projectId}`);
    return project;
  } catch (error) {
    logger.error('Error joining project:', error);
    throw error;
  }
};

/**
 * Leave project
 */
export const leaveProject = async (
  projectId: string,
  userId: string
): Promise<void> => {
  try {
    const project = await CollaborativeProject.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Owner cannot leave
    if (project.owner.toString() === userId) {
      throw new Error('Project owner cannot leave the project');
    }

    // Remove member
    project.members = project.members.filter(m => m.user.toString() !== userId);
    await project.save();

    logger.info(`User ${userId} left project ${projectId}`);
  } catch (error) {
    logger.error('Error leaving project:', error);
    throw error;
  }
};

/**
 * Update project
 */
export const updateProject = async (
  projectId: string,
  userId: string,
  updates: Partial<{
    title: string;
    description: string;
    status: ProjectStatus;
    maxMembers: number;
    settings: any;
  }>
): Promise<CollaborativeProject> => {
  try {
    const project = await CollaborativeProject.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check permissions
    const member = project.members.find(m => m.user.toString() === userId);
    if (!member || (!member.permissions.canEdit && member.role !== 'owner')) {
      throw new Error('You do not have permission to update this project');
    }

    // Update fields
    if (updates.title) project.title = updates.title;
    if (updates.description) project.description = updates.description;
    if (updates.status) {
      project.status = updates.status;
      if (updates.status === 'completed') {
        project.completedAt = new Date();
      }
    }
    if (updates.maxMembers !== undefined) project.maxMembers = updates.maxMembers;
    if (updates.settings) {
      project.settings = { ...project.settings, ...updates.settings };
    }

    await project.save();

    logger.info(`Project ${projectId} updated by user ${userId}`);
    return project;
  } catch (error) {
    logger.error('Error updating project:', error);
    throw error;
  }
};

/**
 * Add task
 */
export const addTask = async (
  projectId: string,
  userId: string,
  task: {
    title: string;
    description?: string;
    assignedTo?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
  }
): Promise<CollaborativeProject> => {
  try {
    const project = await CollaborativeProject.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check permissions
    const member = project.members.find(m => m.user.toString() === userId);
    if (!member || (!member.permissions.canManageTasks && member.role !== 'owner' && member.role !== 'admin')) {
      throw new Error('You do not have permission to add tasks');
    }

    project.tasks.push({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo as any,
      status: 'todo',
      priority: task.priority || 'medium',
      dueDate: task.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await project.save();

    // Notify assigned user
    if (task.assignedTo) {
      await createNotification(task.assignedTo, 'system_announcement', {
        title: 'New Task Assigned',
        message: `You've been assigned a new task in project: ${project.title}`,
        actionUrl: `/projects/${projectId}/tasks`,
        relatedUser: userId,
      });
    }

    logger.info(`Task added to project ${projectId}`);
    return project;
  } catch (error) {
    logger.error('Error adding task:', error);
    throw error;
  }
};

/**
 * Update task
 */
export const updateTask = async (
  projectId: string,
  taskId: string,
  userId: string,
  updates: Partial<{
    title: string;
    description: string;
    assignedTo: string;
    status: 'todo' | 'in_progress' | 'review' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate: Date;
  }>
): Promise<CollaborativeProject> => {
  try {
    const project = await CollaborativeProject.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check permissions
    const member = project.members.find(m => m.user.toString() === userId);
    if (!member || (!member.permissions.canManageTasks && member.role !== 'owner' && member.role !== 'admin')) {
      throw new Error('You do not have permission to update tasks');
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Update task
    if (updates.title) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.assignedTo) task.assignedTo = updates.assignedTo as any;
    if (updates.status) {
      task.status = updates.status;
      if (updates.status === 'completed') {
        task.completedAt = new Date();
      }
    }
    if (updates.priority) task.priority = updates.priority;
    if (updates.dueDate) task.dueDate = updates.dueDate;
    task.updatedAt = new Date();

    await project.save();

    logger.info(`Task ${taskId} updated in project ${projectId}`);
    return project;
  } catch (error) {
    logger.error('Error updating task:', error);
    throw error;
  }
};

/**
 * Add discussion message
 */
export const addDiscussionMessage = async (
  projectId: string,
  userId: string,
  content: string,
  replyToId?: string
): Promise<CollaborativeProject> => {
  try {
    const project = await CollaborativeProject.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if user is a member
    const member = project.members.find(m => m.user.toString() === userId);
    if (!member) {
      throw new Error('You must be a member to participate in discussions');
    }

    if (replyToId) {
      // Add reply
      const parentMessage = project.discussion.id(replyToId);
      if (!parentMessage) {
        throw new Error('Parent message not found');
      }

      if (!parentMessage.replies) {
        parentMessage.replies = [];
      }

      parentMessage.replies.push({
        user: userId as any,
        content,
        createdAt: new Date(),
      });
    } else {
      // Add new message
      project.discussion.push({
        user: userId as any,
        content,
        createdAt: new Date(),
        replies: [],
      });
    }

    await project.save();

    // Notify other members (except sender)
    const otherMembers = project.members.filter(m => m.user.toString() !== userId);
    for (const member of otherMembers) {
      await createNotification(member.user.toString(), 'system_announcement', {
        title: 'New Discussion Message',
        message: `New message in project: ${project.title}`,
        actionUrl: `/projects/${projectId}/discussion`,
        relatedUser: userId,
      }).catch((error) => {
        logger.error('Error sending notification:', error);
      });
    }

    logger.info(`Discussion message added to project ${projectId}`);
    return project;
  } catch (error) {
    logger.error('Error adding discussion message:', error);
    throw error;
  }
};

/**
 * Add resource
 */
export const addResource = async (
  projectId: string,
  userId: string,
  resource: {
    type: 'file' | 'link' | 'code_repo';
    title: string;
    url?: string;
    fileKey?: string;
    description?: string;
  }
): Promise<CollaborativeProject> => {
  try {
    const project = await CollaborativeProject.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check permissions
    const member = project.members.find(m => m.user.toString() === userId);
    if (!member || (!member.permissions.canEdit && member.role !== 'owner' && member.role !== 'admin')) {
      throw new Error('You do not have permission to add resources');
    }

    project.resources.push({
      type: resource.type,
      title: resource.title,
      url: resource.url,
      fileKey: resource.fileKey,
      description: resource.description,
      uploadedBy: userId as any,
      uploadedAt: new Date(),
    });

    await project.save();

    logger.info(`Resource added to project ${projectId}`);
    return project;
  } catch (error) {
    logger.error('Error adding resource:', error);
    throw error;
  }
};

/**
 * Submit deliverable
 */
export const submitDeliverable = async (
  projectId: string,
  userId: string,
  deliverable: {
    title: string;
    description?: string;
    type: 'file' | 'link' | 'code_repo';
    url?: string;
    fileKey?: string;
  }
): Promise<CollaborativeProject> => {
  try {
    const project = await CollaborativeProject.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if user is a member
    const member = project.members.find(m => m.user.toString() === userId);
    if (!member) {
      throw new Error('You must be a member to submit deliverables');
    }

    project.deliverables.push({
      title: deliverable.title,
      description: deliverable.description,
      type: deliverable.type,
      url: deliverable.url,
      fileKey: deliverable.fileKey,
      submittedBy: userId as any,
      submittedAt: new Date(),
    });

    await project.save();

    // Notify owner and admins
    const admins = project.members.filter(m => 
      m.role === 'owner' || m.role === 'admin'
    );
    for (const admin of admins) {
      if (admin.user.toString() !== userId) {
        await createNotification(admin.user.toString(), 'system_announcement', {
          title: 'New Deliverable Submitted',
          message: `A deliverable has been submitted for project: ${project.title}`,
          actionUrl: `/projects/${projectId}/deliverables`,
          relatedUser: userId,
        }).catch((error) => {
          logger.error('Error sending notification:', error);
        });
      }
    }

    logger.info(`Deliverable submitted to project ${projectId}`);
    return project;
  } catch (error) {
    logger.error('Error submitting deliverable:', error);
    throw error;
  }
};

/**
 * Get user projects
 */
export const getUserProjects = async (
  userId: string,
  options?: {
    status?: ProjectStatus;
    courseId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ projects: CollaborativeProject[]; total: number }> => {
  try {
    const query: any = {
      $or: [
        { owner: userId },
        { 'members.user': userId },
      ],
    };

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.courseId) {
      query.course = options.courseId;
    }

    const total = await CollaborativeProject.countDocuments(query);

    const projects = await CollaborativeProject.find(query)
      .populate('owner', 'username profilePhoto')
      .populate('members.user', 'username profilePhoto')
      .populate('course', 'title thumbnail')
      .populate('assignment', 'title')
      .sort({ updatedAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { projects, total };
  } catch (error) {
    logger.error('Error getting user projects:', error);
    return { projects: [], total: 0 };
  }
};

/**
 * Get project by ID
 */
export const getProject = async (
  projectId: string,
  userId?: string
): Promise<CollaborativeProject | null> => {
  try {
    const project = await CollaborativeProject.findById(projectId)
      .populate('owner', 'username profilePhoto')
      .populate('members.user', 'username profilePhoto')
      .populate('tasks.assignedTo', 'username profilePhoto')
      .populate('discussion.user', 'username profilePhoto')
      .populate('discussion.replies.user', 'username profilePhoto')
      .populate('resources.uploadedBy', 'username profilePhoto')
      .populate('deliverables.submittedBy', 'username profilePhoto')
      .populate('deliverables.approvedBy', 'username profilePhoto')
      .populate('course', 'title thumbnail')
      .populate('assignment', 'title');

    if (!project) {
      return null;
    }

    // Check if user has access
    if (userId) {
      const isMember = project.members.some(m => m.user.toString() === userId) || 
                      project.owner.toString() === userId;
      if (!project.settings.isPublic && !isMember) {
        return null;
      }
    } else if (!project.settings.isPublic) {
      return null;
    }

    return project;
  } catch (error) {
    logger.error('Error getting project:', error);
    return null;
  }
};


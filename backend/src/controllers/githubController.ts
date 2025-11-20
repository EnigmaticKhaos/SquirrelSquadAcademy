import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { IUser } from '../models/User';
import {
  hasGitHubConnected,
  createUserRepo,
  createAssignmentRepo,
  getRepoContents,
  getFileContent,
  getRepoCommits,
  getCommit,
  getAllCodeFiles,
  linkExistingRepo,
  getUserRepos,
  getGitHubUsername,
} from '../services/githubService';
import Assignment from '../models/Assignment';
import Course from '../models/Course';
import logger from '../utils/logger';

// @desc    Check if user has GitHub connected
// @route   GET /api/github/status
// @access  Private
export const checkGitHubStatus = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const connected = await hasGitHubConnected(userId);
  const username = connected ? await getGitHubUsername(userId) : null;

  res.json({
    success: true,
    connected,
    username,
  });
});

// @desc    Get user's GitHub repositories
// @route   GET /api/github/repos
// @access  Private
export const getUserRepositories = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const repos = await getUserRepos(userId);

  res.json({
    success: true,
    repos,
  });
});

// @desc    Create a new repository for user
// @route   POST /api/github/repos
// @access  Private
export const createRepository = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { name, description, isPrivate } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Repository name is required',
    });
  }

  const repo = await createUserRepo(userId, name, description, isPrivate || false);

  res.status(201).json({
    success: true,
    repo,
  });
});

// @desc    Create assignment repository
// @route   POST /api/github/assignments/:id/repo
// @access  Private
export const createAssignmentRepository = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;

  const assignment = await Assignment.findById(id).populate('course');
  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  const course = await Course.findById(assignment.course);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  // Check if assignment type supports GitHub
  if (assignment.assignmentType !== 'github' && assignment.assignmentType !== 'coding') {
    return res.status(400).json({
      success: false,
      message: 'This assignment type does not support GitHub repositories',
    });
  }

  try {
    const repo = await createAssignmentRepo(
      id,
      userId,
      course.title,
      assignment.title
    );

    // Update assignment with repo URL if not already set
    if (!assignment.githubRepoUrl) {
      assignment.githubRepoUrl = repo.html_url;
      // Store org name from config if available
      const { config } = await import('../config/env');
      if (config.githubOrgName) {
        assignment.githubOrg = config.githubOrgName;
      }
      await assignment.save();
    }

    res.status(201).json({
      success: true,
      repo,
      message: 'Assignment repository created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating assignment repo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create assignment repository',
    });
  }
});

// @desc    Link existing repository to assignment
// @route   POST /api/github/assignments/:id/link
// @access  Private
export const linkRepository = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { id } = req.params;
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({
      success: false,
      message: 'Repository URL is required',
    });
  }

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  try {
    const repo = await linkExistingRepo(userId, repoUrl);

    // Update assignment with repo URL
    assignment.githubRepoUrl = repo.html_url;
    await assignment.save();

    res.json({
      success: true,
      repo,
      message: 'Repository linked successfully',
    });
  } catch (error: any) {
    logger.error('Error linking repository:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to link repository',
    });
  }
});

// @desc    Get repository contents
// @route   GET /api/github/repos/:owner/:repo/contents
// @access  Private
export const getRepositoryContents = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { owner, repo } = req.params;
  const { path } = req.query;

  const contents = await getRepoContents(userId, owner, repo, (path as string) || '');

  res.json({
    success: true,
    contents,
  });
});

// @desc    Get file content from repository
// @route   GET /api/github/repos/:owner/:repo/files/:path(*)
// @access  Private
export const getRepositoryFile = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { owner, repo } = req.params;
  const filePath = req.params[0]; // Catch-all parameter
  const { ref } = req.query;

  const content = await getFileContent(userId, owner, repo, filePath, ref as string);

  res.json({
    success: true,
    content,
    path: filePath,
  });
});

// @desc    Get repository commits
// @route   GET /api/github/repos/:owner/:repo/commits
// @access  Private
export const getRepositoryCommits = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { owner, repo } = req.params;
  const { sha, limit } = req.query;

  const commits = await getRepoCommits(
    userId,
    owner,
    repo,
    sha as string,
    limit ? parseInt(limit as string) : 10
  );

  res.json({
    success: true,
    commits,
  });
});

// @desc    Get specific commit
// @route   GET /api/github/repos/:owner/:repo/commits/:sha
// @access  Private
export const getRepositoryCommit = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { owner, repo, sha } = req.params;

  const commit = await getCommit(userId, owner, repo, sha);

  res.json({
    success: true,
    commit,
  });
});

// @desc    Get all code files from repository (for grading)
// @route   GET /api/github/repos/:owner/:repo/code
// @access  Private
export const getRepositoryCode = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { owner, repo } = req.params;
  const { ref } = req.query;

  const codeFiles = await getAllCodeFiles(userId, owner, repo, ref as string);

  res.json({
    success: true,
    codeFiles,
  });
});


import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import User from '../models/User';
import Assignment from '../models/Assignment';
import logger from '../utils/logger';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
}

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  sha: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
}

/**
 * Get GitHub API client for a user
 */
const getGitHubClient = (accessToken: string): AxiosInstance => {
  return axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
};

/**
 * Get GitHub API client using admin token (for organization operations)
 */
const getAdminGitHubClient = (): AxiosInstance => {
  if (!config.githubAccessToken) {
    throw new Error('GitHub access token not configured');
  }
  return getGitHubClient(config.githubAccessToken);
};

/**
 * Get user's GitHub access token
 */
export const getUserGitHubToken = async (userId: string): Promise<string | null> => {
  try {
    const user = await User.findById(userId).select('oauthTokens');
    return user?.oauthTokens?.github || null;
  } catch (error) {
    logger.error('Error getting user GitHub token:', error);
    return null;
  }
};

/**
 * Check if user has GitHub connected
 */
export const hasGitHubConnected = async (userId: string): Promise<boolean> => {
  const token = await getUserGitHubToken(userId);
  return !!token;
};

/**
 * Create a repository for a user
 */
export const createUserRepo = async (
  userId: string,
  repoName: string,
  description?: string,
  isPrivate: boolean = false
): Promise<GitHubRepo> => {
  try {
    const token = await getUserGitHubToken(userId);
    if (!token) {
      throw new Error('User has not connected GitHub account');
    }

    const client = getGitHubClient(token);
    const response = await client.post('/user/repos', {
      name: repoName,
      description: description || '',
      private: isPrivate,
      auto_init: true, // Initialize with README
    });

    logger.info(`Created GitHub repo ${repoName} for user ${userId}`);
    return response.data;
  } catch (error: any) {
    logger.error('Error creating user repo:', error);
    throw new Error(`Failed to create repository: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Create a repository in the organization for an assignment
 */
export const createAssignmentRepo = async (
  assignmentId: string,
  userId: string,
  courseTitle: string,
  assignmentTitle: string
): Promise<GitHubRepo> => {
  try {
    if (!config.githubOrgName) {
      throw new Error('GitHub organization not configured');
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Use admin token for organization repos
    const client = getAdminGitHubClient();

    // Generate repo name: course-title-assignment-title-userId
    const repoName = `${courseTitle.toLowerCase().replace(/\s+/g, '-')}-${assignmentTitle.toLowerCase().replace(/\s+/g, '-')}-${userId}`.substring(0, 100);

    // Create repo in organization
    const response = await client.post(`/orgs/${config.githubOrgName}/repos`, {
      name: repoName,
      description: `Assignment: ${assignmentTitle} - ${courseTitle}`,
      private: true,
      auto_init: true,
    });

    const repo = response.data;

    // Add user as collaborator
    const userToken = await getUserGitHubToken(userId);
    if (userToken) {
      try {
        // Get user's GitHub username
        const userClient = getGitHubClient(userToken);
        const userResponse = await userClient.get('/user');
        const githubUsername = userResponse.data.login;

        // Add user as collaborator with write access
        await client.put(`/repos/${config.githubOrgName}/${repoName}/collaborators/${githubUsername}`, {
          permission: 'push',
        });
      } catch (error) {
        logger.warn('Could not add user as collaborator, but repo was created:', error);
      }
    }

    logger.info(`Created assignment repo ${repoName} in org ${config.githubOrgName}`);
    return repo;
  } catch (error: any) {
    logger.error('Error creating assignment repo:', error);
    throw new Error(`Failed to create assignment repository: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get repository contents
 */
export const getRepoContents = async (
  userId: string,
  owner: string,
  repo: string,
  path: string = ''
): Promise<GitHubFile[]> => {
  try {
    const token = await getUserGitHubToken(userId);
    if (!token) {
      throw new Error('User has not connected GitHub account');
    }

    const client = getGitHubClient(token);
    const response = await client.get(`/repos/${owner}/${repo}/contents/${path}`);

    return Array.isArray(response.data) ? response.data : [response.data];
  } catch (error: any) {
    logger.error('Error getting repo contents:', error);
    throw new Error(`Failed to get repository contents: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get file content from repository
 */
export const getFileContent = async (
  userId: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<string> => {
  try {
    const token = await getUserGitHubToken(userId);
    if (!token) {
      throw new Error('User has not connected GitHub account');
    }

    const client = getGitHubClient(token);
    const params = ref ? { ref } : {};
    const response = await client.get(`/repos/${owner}/${repo}/contents/${path}`, { params });

    if (response.data.encoding === 'base64' && response.data.content) {
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    }

    return response.data.content || '';
  } catch (error: any) {
    logger.error('Error getting file content:', error);
    throw new Error(`Failed to get file content: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get repository commits
 */
export const getRepoCommits = async (
  userId: string,
  owner: string,
  repo: string,
  sha?: string,
  limit: number = 10
): Promise<GitHubCommit[]> => {
  try {
    const token = await getUserGitHubToken(userId);
    if (!token) {
      throw new Error('User has not connected GitHub account');
    }

    const client = getGitHubClient(token);
    const params: any = { per_page: limit };
    if (sha) {
      params.sha = sha;
    }

    const response = await client.get(`/repos/${owner}/${repo}/commits`, { params });
    return response.data;
  } catch (error: any) {
    logger.error('Error getting repo commits:', error);
    throw new Error(`Failed to get repository commits: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get specific commit
 */
export const getCommit = async (
  userId: string,
  owner: string,
  repo: string,
  sha: string
): Promise<GitHubCommit> => {
  try {
    const token = await getUserGitHubToken(userId);
    if (!token) {
      throw new Error('User has not connected GitHub account');
    }

    const client = getGitHubClient(token);
    const response = await client.get(`/repos/${owner}/${repo}/commits/${sha}`);
    return response.data;
  } catch (error: any) {
    logger.error('Error getting commit:', error);
    throw new Error(`Failed to get commit: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get all code files from a repository (for grading)
 */
export const getAllCodeFiles = async (
  userId: string,
  owner: string,
  repo: string,
  ref?: string
): Promise<Array<{ path: string; content: string; language?: string }>> => {
  try {
    const codeFiles: Array<{ path: string; content: string; language?: string }> = [];
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.rb', '.go', '.rs', '.php', '.swift', '.kt', '.scala', '.r', '.sql', '.html', '.css', '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml'];

    const getFilesRecursively = async (path: string = ''): Promise<void> => {
      const contents = await getRepoContents(userId, owner, repo, path);

      for (const item of contents) {
        if (item.type === 'file') {
          const extension = item.path.substring(item.path.lastIndexOf('.'));
          if (codeExtensions.includes(extension)) {
            try {
              const content = await getFileContent(userId, owner, repo, item.path, ref);
              codeFiles.push({
                path: item.path,
                content,
                language: extension.substring(1), // Remove the dot
              });
            } catch (error) {
              logger.warn(`Could not read file ${item.path}:`, error);
            }
          }
        } else if (item.type === 'dir') {
          // Skip common non-code directories
          if (!['node_modules', '.git', 'dist', 'build', '.next', 'venv', '__pycache__'].includes(item.name)) {
            await getFilesRecursively(item.path);
          }
        }
      }
    };

    await getFilesRecursively();
    return codeFiles;
  } catch (error: any) {
    logger.error('Error getting all code files:', error);
    throw new Error(`Failed to get code files: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Link existing repository
 */
export const linkExistingRepo = async (
  userId: string,
  repoUrl: string
): Promise<GitHubRepo> => {
  try {
    // Parse repo URL to get owner and repo name
    const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = match;
    const token = await getUserGitHubToken(userId);
    if (!token) {
      throw new Error('User has not connected GitHub account');
    }

    const client = getGitHubClient(token);
    const response = await client.get(`/repos/${owner}/${repo}`);

    logger.info(`Linked existing repo ${owner}/${repo} for user ${userId}`);
    return response.data;
  } catch (error: any) {
    logger.error('Error linking existing repo:', error);
    throw new Error(`Failed to link repository: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get user's repositories
 */
export const getUserRepos = async (userId: string): Promise<GitHubRepo[]> => {
  try {
    const token = await getUserGitHubToken(userId);
    if (!token) {
      throw new Error('User has not connected GitHub account');
    }

    const client = getGitHubClient(token);
    const response = await client.get('/user/repos', {
      params: {
        sort: 'updated',
        per_page: 100,
      },
    });

    return response.data;
  } catch (error: any) {
    logger.error('Error getting user repos:', error);
    throw new Error(`Failed to get repositories: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get user's GitHub username
 */
export const getGitHubUsername = async (userId: string): Promise<string | null> => {
  try {
    const token = await getUserGitHubToken(userId);
    if (!token) {
      return null;
    }

    const client = getGitHubClient(token);
    const response = await client.get('/user');
    return response.data.login;
  } catch (error: any) {
    logger.error('Error getting GitHub username:', error);
    return null;
  }
};


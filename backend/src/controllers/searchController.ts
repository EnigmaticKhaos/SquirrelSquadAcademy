import { Request, Response } from 'express';
import User from '../models/User';
import Course from '../models/Course';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Lesson from '../models/Lesson';
import Project from '../models/Project';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';

// @desc    Global search across all content types
// @route   GET /api/search
// @access  Public
export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
  const {
    q,
    type, // 'all' | 'users' | 'courses' | 'posts' | 'comments' | 'lessons' | 'projects'
    courseType,
    difficulty,
    category,
    tags,
    page = 1,
    limit = 10,
  } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const searchQuery = (q as string).trim();
  const searchType = (type as string) || 'all';
  const skip = (Number(page) - 1) * Number(limit);
  const results: any = {
    users: [],
    courses: [],
    posts: [],
    comments: [],
    lessons: [],
    projects: [],
  };

  const counts: any = {
    users: 0,
    courses: 0,
    posts: 0,
    comments: 0,
    lessons: 0,
    projects: 0,
  };

  // Search users
  if (searchType === 'all' || searchType === 'users') {
    const userQuery: any = {
      $text: { $search: searchQuery },
    };

    const userResults = await User.find(userQuery)
      .select('username email profilePhoto bio level xp')
      .limit(Number(limit))
      .skip(skip);

    const userTotal = await User.countDocuments(userQuery);

    results.users = userResults;
    counts.users = userTotal;
  }

  // Search courses
  if (searchType === 'all' || searchType === 'courses') {
    const courseQuery: any = {
      $text: { $search: searchQuery },
      status: 'published',
    };

    if (courseType) courseQuery.courseType = courseType;
    if (difficulty) courseQuery.difficulty = difficulty;
    if (category) courseQuery.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      courseQuery.tags = { $in: tagArray };
    }

    const courseResults = await Course.find(courseQuery)
      .select('-versionHistory')
      .populate('modules')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const courseTotal = await Course.countDocuments(courseQuery);

    results.courses = courseResults;
    counts.courses = courseTotal;
  }

  // Search posts
  if (searchType === 'all' || searchType === 'posts') {
    const postQuery: any = {
      $text: { $search: searchQuery },
      isPublic: true,
    };

    const postResults = await Post.find(postQuery)
      .populate('user', 'username profilePhoto')
      .populate('sharedProject')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const postTotal = await Post.countDocuments(postQuery);

    results.posts = postResults;
    counts.posts = postTotal;
  }

  // Search comments
  if (searchType === 'all' || searchType === 'comments') {
    const commentQuery: any = {
      $text: { $search: searchQuery },
    };

    const commentResults = await Comment.find(commentQuery)
      .populate('user', 'username profilePhoto')
      .populate('post', 'content')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const commentTotal = await Comment.countDocuments(commentQuery);

    results.comments = commentResults;
    counts.comments = commentTotal;
  }

  // Search lessons
  if (searchType === 'all' || searchType === 'lessons') {
    const lessonQuery: any = {
      $text: { $search: searchQuery },
    };

    const lessonResults = await Lesson.find(lessonQuery)
      .populate('module', 'title')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const lessonTotal = await Lesson.countDocuments(lessonQuery);

    results.lessons = lessonResults;
    counts.lessons = lessonTotal;
  }

  // Search projects
  if (searchType === 'all' || searchType === 'projects') {
    const projectQuery: any = {
      $text: { $search: searchQuery },
      isPublic: true,
    };

    const projectResults = await Project.find(projectQuery)
      .populate('user', 'username profilePhoto')
      .populate('course', 'title')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const projectTotal = await Project.countDocuments(projectQuery);

    results.projects = projectResults;
    counts.projects = projectTotal;
  }

  const totalResults = Object.values(counts).reduce((sum: number, count: any) => sum + count, 0);

  res.json({
    success: true,
    query: searchQuery,
    type: searchType,
    results,
    counts,
    total: totalResults,
    page: Number(page),
    limit: Number(limit),
  });
});

// @desc    Search users
// @route   GET /api/search/users
// @access  Public
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const searchQuery = (q as string).trim();
  const skip = (Number(page) - 1) * Number(limit);

  const query: any = {
    $text: { $search: searchQuery },
  };

  const users = await User.find(query)
    .select('username email profilePhoto bio level xp onlineStatus')
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    query: searchQuery,
    count: users.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    users,
  });
});

// @desc    Search courses
// @route   GET /api/search/courses
// @access  Public
export const searchCourses = asyncHandler(async (req: Request, res: Response) => {
  const {
    q,
    courseType,
    difficulty,
    category,
    tags,
    isFree,
    minRating,
    sort = 'relevance', // 'relevance' | 'newest' | 'popular' | 'rating'
    page = 1,
    limit = 10,
  } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const searchQuery = (q as string).trim();
  const skip = (Number(page) - 1) * Number(limit);

  const query: any = {
    $text: { $search: searchQuery },
    status: 'published',
  };

  if (courseType) query.courseType = courseType;
  if (difficulty) query.difficulty = difficulty;
  if (category) query.category = category;
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    query.tags = { $in: tagArray };
  }
  if (isFree !== undefined) query.isFree = isFree === 'true';
  if (minRating) query.averageRating = { $gte: Number(minRating) };

  const sortOptions: any = {};
  switch (sort) {
    case 'newest':
      sortOptions.createdAt = -1;
      break;
    case 'popular':
      sortOptions.enrollmentCount = -1;
      break;
    case 'rating':
      sortOptions.averageRating = -1;
      break;
    default:
      // Relevance (text search score)
      sortOptions.score = { $meta: 'textScore' };
  }

  const courses = await Course.find(query, { score: { $meta: 'textScore' } })
    .select('-versionHistory')
    .populate('modules')
    .sort(sortOptions)
    .limit(Number(limit))
    .skip(skip);

  const total = await Course.countDocuments(query);

  res.json({
    success: true,
    query: searchQuery,
    count: courses.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    courses,
  });
});

// @desc    Search posts
// @route   GET /api/search/posts
// @access  Public
export const searchPosts = asyncHandler(async (req: Request, res: Response) => {
  const {
    q,
    userId,
    type, // 'text' | 'image' | 'video'
    sort = 'relevance', // 'relevance' | 'newest' | 'popular'
    page = 1,
    limit = 10,
  } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const searchQuery = (q as string).trim();
  const skip = (Number(page) - 1) * Number(limit);

  const query: any = {
    $text: { $search: searchQuery },
    isPublic: true,
  };

  if (userId) query.user = userId;
  if (type) query.type = type;

  const sortOptions: any = {};
  switch (sort) {
    case 'newest':
      sortOptions.createdAt = -1;
      break;
    case 'popular':
      sortOptions.likesCount = -1;
      break;
    default:
      sortOptions.score = { $meta: 'textScore' };
  }

  const posts = await Post.find(query, { score: { $meta: 'textScore' } })
    .populate('user', 'username profilePhoto')
    .populate('sharedProject')
    .sort(sortOptions)
    .limit(Number(limit))
    .skip(skip);

  const total = await Post.countDocuments(query);

  res.json({
    success: true,
    query: searchQuery,
    count: posts.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    posts,
  });
});

// @desc    Search comments
// @route   GET /api/search/comments
// @access  Public
export const searchComments = asyncHandler(async (req: Request, res: Response) => {
  const {
    q,
    userId,
    postId,
    sort = 'relevance',
    page = 1,
    limit = 10,
  } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const searchQuery = (q as string).trim();
  const skip = (Number(page) - 1) * Number(limit);

  const query: any = {
    $text: { $search: searchQuery },
  };

  if (userId) query.user = userId;
  if (postId) query.post = postId;

  const sortOptions: any = {};
  switch (sort) {
    case 'newest':
      sortOptions.createdAt = -1;
      break;
    case 'popular':
      sortOptions.likesCount = -1;
      break;
    default:
      sortOptions.score = { $meta: 'textScore' };
  }

  const comments = await Comment.find(query, { score: { $meta: 'textScore' } })
    .populate('user', 'username profilePhoto')
    .populate('post', 'content')
    .sort(sortOptions)
    .limit(Number(limit))
    .skip(skip);

  const total = await Comment.countDocuments(query);

  res.json({
    success: true,
    query: searchQuery,
    count: comments.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    comments,
  });
});

// @desc    Search lessons
// @route   GET /api/search/lessons
// @access  Public
export const searchLessons = asyncHandler(async (req: Request, res: Response) => {
  const {
    q,
    moduleId,
    courseId,
    sort = 'relevance',
    page = 1,
    limit = 10,
  } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const searchQuery = (q as string).trim();
  const skip = (Number(page) - 1) * Number(limit);

  const query: any = {
    $text: { $search: searchQuery },
  };

  if (moduleId) query.module = moduleId;
  if (courseId) {
    // Find lessons through modules
    const Module = (await import('../models/Module')).default;
    const modules = await Module.find({ course: courseId }).select('_id');
    query.module = { $in: modules.map(m => m._id) };
  }

  const sortOptions: any = {};
  switch (sort) {
    case 'newest':
      sortOptions.createdAt = -1;
      break;
    default:
      sortOptions.score = { $meta: 'textScore' };
  }

  const lessons = await Lesson.find(query, { score: { $meta: 'textScore' } })
    .populate('module', 'title')
    .sort(sortOptions)
    .limit(Number(limit))
    .skip(skip);

  const total = await Lesson.countDocuments(query);

  res.json({
    success: true,
    query: searchQuery,
    count: lessons.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    lessons,
  });
});

// @desc    Search projects
// @route   GET /api/search/projects
// @access  Public
export const searchProjects = asyncHandler(async (req: Request, res: Response) => {
  const {
    q,
    userId,
    courseId,
    category,
    tags,
    type, // 'github' | 'deployed' | 'file' | 'code'
    language,
    sort = 'relevance', // 'relevance' | 'newest' | 'popular'
    page = 1,
    limit = 10,
  } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const searchQuery = (q as string).trim();
  const skip = (Number(page) - 1) * Number(limit);

  const query: any = {
    $text: { $search: searchQuery },
    isPublic: true,
  };

  if (userId) query.user = userId;
  if (courseId) query.course = courseId;
  if (category) query.category = category;
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    query.tags = { $in: tagArray };
  }
  if (type) query.type = type;
  if (language) query.language = language;

  const sortOptions: any = {};
  switch (sort) {
    case 'newest':
      sortOptions.createdAt = -1;
      break;
    case 'popular':
      sortOptions.likesCount = -1;
      break;
    default:
      sortOptions.score = { $meta: 'textScore' };
  }

  const projects = await Project.find(query, { score: { $meta: 'textScore' } })
    .populate('user', 'username profilePhoto')
    .populate('course', 'title')
    .sort(sortOptions)
    .limit(Number(limit))
    .skip(skip);

  const total = await Project.countDocuments(query);

  res.json({
    success: true,
    query: searchQuery,
    count: projects.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    projects,
  });
});


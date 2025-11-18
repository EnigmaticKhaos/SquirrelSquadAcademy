import mongoose from 'mongoose';
import User from '../../models/User';
import Course from '../../models/Course';
import Achievement from '../../models/Achievement';
import Badge from '../../models/Badge';
import { generateToken } from '../../utils/jwt';

/**
 * Create a test user
 */
export const createTestUser = async (overrides: any = {}) => {
  const defaultUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    isEmailVerified: true,
    role: 'user',
    ...overrides,
  };

  const user = await User.create(defaultUser);
  return user;
};

/**
 * Create a test admin user
 */
export const createTestAdmin = async (overrides: any = {}) => {
  return createTestUser({
    role: 'admin',
    ...overrides,
  });
};

/**
 * Create a test course
 */
export const createTestCourse = async (overrides: any = {}) => {
  const defaultCourse = {
    title: 'Test Course',
    description: 'Test course description',
    courseType: 'coding',
    difficulty: 'beginner',
    status: 'published',
    category: 'programming',
    estimatedDuration: 10,
    ...overrides,
  };

  const course = await Course.create(defaultCourse);
  return course;
};

/**
 * Create a test achievement
 */
export const createTestAchievement = async (overrides: any = {}) => {
  const defaultAchievement = {
    name: 'Test Achievement',
    description: 'Test achievement description',
    tier: 'common',
    triggerType: 'xp_earned',
    triggerData: { amount: 100 },
    ...overrides,
  };

  const achievement = await Achievement.create(defaultAchievement);
  return achievement;
};

/**
 * Create a test badge
 */
export const createTestBadge = async (overrides: any = {}) => {
  const defaultBadge = {
    name: 'Test Badge',
    description: 'Test badge description',
    icon: 'test-icon',
    ...overrides,
  };

  const badge = await Badge.create(defaultBadge);
  return badge;
};

/**
 * Get auth token for a user
 */
export const getAuthToken = (userId: string) => {
  return generateToken({
    userId,
    email: 'test@example.com',
    role: 'user',
  });
};

/**
 * Create authenticated request headers
 */
export const getAuthHeaders = (userId: string) => {
  const token = getAuthToken(userId);
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Clean database
 */
export const cleanDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Wait for async operations
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


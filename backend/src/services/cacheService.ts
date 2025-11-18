import NodeCache from 'node-cache';
import logger from '../utils/logger';

// Create cache instance with default TTL of 1 hour
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour default TTL
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Don't clone values (better performance)
});

/**
 * Get value from cache
 */
export const get = <T>(key: string): T | undefined => {
  try {
    return cache.get<T>(key);
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return undefined;
  }
};

/**
 * Set value in cache
 */
export const set = <T>(key: string, value: T, ttl?: number): boolean => {
  try {
    return cache.set(key, value, ttl || 3600);
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete value from cache
 */
export const del = (key: string): number => {
  try {
    return cache.del(key);
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
    return 0;
  }
};

/**
 * Delete multiple keys matching pattern
 */
export const delPattern = (pattern: string): number => {
  try {
    const keys = cache.keys();
    const regex = new RegExp(pattern);
    let deleted = 0;
    
    keys.forEach((key) => {
      if (regex.test(key)) {
        cache.del(key);
        deleted++;
      }
    });
    
    return deleted;
  } catch (error) {
    logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
    return 0;
  }
};

/**
 * Clear all cache
 */
export const clear = (): void => {
  try {
    cache.flushAll();
    logger.info('Cache cleared');
  } catch (error) {
    logger.error('Cache clear error:', error);
  }
};

/**
 * Get cache statistics
 */
export const getStats = () => {
  return cache.getStats();
};

/**
 * Check if key exists in cache
 */
export const has = (key: string): boolean => {
  return cache.has(key);
};

/**
 * Get or set value (if not in cache, fetch and cache it)
 */
export const getOrSet = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const cached = get<T>(key);
  if (cached !== undefined) {
    return cached;
  }
  
  const value = await fetchFn();
  set(key, value, ttl);
  return value;
};

// Cache key generators
export const cacheKeys = {
  course: (id: string) => `course:${id}`,
  courseList: (query: string) => `courses:list:${query}`,
  courseModules: (courseId: string) => `course:${courseId}:modules`,
  courseStats: (courseId: string) => `course:${courseId}:stats`,
  userCourses: (userId: string) => `user:${userId}:courses`,
  courseEnrollments: (courseId: string) => `course:${courseId}:enrollments`,
  courseCompletions: (courseId: string) => `course:${courseId}:completions`,
};


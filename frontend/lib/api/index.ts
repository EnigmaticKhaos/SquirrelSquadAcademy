// Main API instance - import from the apiClient.ts file
export { api } from '../apiClient';
export type { ApiResponse } from '@/types';

// Feature-specific API modules
export { authApi } from './auth';
export { usersApi } from './users';
export { coursesApi, courseReviewsApi, courseBundlesApi, courseWaitlistApi } from './courses';
export { learningPathsApi } from './learningPaths';
export { notificationsApi } from './notifications';
export { postsApi, commentsApi, projectsApi } from './social';
export { achievementsApi, badgesApi, challengesApi, leaderboardApi } from './gamification';
export { searchApi } from './search';
export { messagesApi } from './messages';
export { collaborativeProjectsApi } from './collaborativeProjects';

// Also export everything from each module
export * from './auth';
export * from './users';
export * from './courses';
export * from './learningPaths';
export * from './notifications';
export * from './social';
export * from './gamification';
export * from './search';
export * from './messages';


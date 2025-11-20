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
export { savedContentApi, type SavedContent, type SavedContentType } from './savedContent';
export { achievementsApi, badgesApi, challengesApi, leaderboardApi } from './gamification';
export { searchApi } from './search';
export { messagesApi } from './messages';
export { collaborativeProjectsApi } from './collaborativeProjects';
export { notesApi } from './notes';
export { flashcardsApi } from './flashcards';
export { certificatesApi } from './certificates';
export { forumsApi } from './forums';
export { lessonsApi } from './lessons';
export { modulesApi } from './modules';
export { videosApi } from './videos';
export { courseCompletionApi } from './courseCompletion';
export { assignmentsApi } from './assignments';
export { submissionsApi } from './submissions';
export { uploadApi } from './upload';
export { pomodoroApi } from './pomodoro';

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
export * from './notes';
export * from './flashcards';
export * from './certificates';
export * from './forums';
export * from './lessons';
export * from './modules';
export * from './videos';
export * from './courseCompletion';
export * from './assignments';
export * from './submissions';


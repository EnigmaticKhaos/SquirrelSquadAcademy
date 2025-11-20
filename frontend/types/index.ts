// ============================================================================
// Base Types
// ============================================================================

export type CourseType = 'coding' | 'non-coding';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type UserRole = 'user' | 'admin';
export type OnlineStatus = 'online' | 'offline';
export type PostType = 'text' | 'image' | 'video';
export type AssignmentType = 'coding' | 'github' | 'written' | 'design' | 'business' | 'marketing' | 'writing' | 'cli';
export type SubmissionStatus = 'pending' | 'grading' | 'graded' | 'failed';
export type VideoSource = 'upload' | 'youtube';
export type LearningPathType = 'curated' | 'ai-powered';
export type ChallengeType = 'complete_courses' | 'earn_xp' | 'reach_level' | 'complete_assignments' | 'share_projects' | 'social_engagement' | 'custom';
export type ChallengeStatus = 'upcoming' | 'active' | 'ended';
export type ProjectType = 'github' | 'deployed' | 'file' | 'code';
export type AchievementTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'exotic' | 'mythic';
export type AchievementCategory = 'course' | 'lesson' | 'quiz' | 'assignment' | 'social' | 'streak' | 'special' | 'project';
export type NotificationType =
  | 'social_like' | 'social_comment' | 'social_mention' | 'social_follow' | 'social_friend_request' | 'social_friend_accepted'
  | 'message_received' | 'achievement_unlocked' | 'badge_earned' | 'level_up' | 'course_enrolled' | 'course_completed'
  | 'course_update' | 'course_announcement' | 'forum_reply' | 'forum_mention' | 'assignment_graded' | 'assignment_feedback'
  | 'challenge_started' | 'challenge_completed' | 'goal_completed' | 'waitlist_notification' | 'referral_success'
  | 'system_announcement' | 'study_reminder' | 'live_session_registered' | 'question_answered' | 'live_session_reminder'
  | 'support_ticket_created' | 'ticket_message' | 'ticket_resolved' | 'ticket_assigned';

// ============================================================================
// User Types
// ============================================================================

export interface User {
  _id: string;
  username: string;
  email: string;
  profilePhoto?: string;
  backgroundImage?: string;
  bio?: string;
  role: UserRole;
  xp: number;
  level: number;
  onlineStatus: OnlineStatus;
  lastSeen?: string;
  profileCardBadge?: string;
  
  // Social links
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  
  // Privacy settings
  privacySettings?: {
    profileVisibility: 'public' | 'private' | 'friends';
    whoCanMessage: 'everyone' | 'friends' | 'none';
    activityVisibility: 'public' | 'private' | 'friends';
  };
  
  // Notification preferences
  notificationPreferences?: {
    email?: boolean;
    inApp?: boolean;
    [key: string]: boolean | undefined;
  };
  
  // Subscription
  subscription?: {
    tier: 'free' | 'premium';
    currentPeriodEnd?: string;
  };
  
  // Mentor status
  mentorStatus?: {
    isMentor: boolean;
    isAvailable: boolean;
    specialties?: string[];
    mentorBio?: string;
    stats?: {
      totalMentees: number;
      activeMentorships: number;
      completedMentorships: number;
      averageRating: number;
    };
  };
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Course Types
// ============================================================================

export interface Course {
  _id: string;
  title: string;
  description: string;
  courseType: CourseType;
  difficulty: DifficultyLevel;
  estimatedDuration: number;
  tags: string[];
  category: string;
  thumbnail?: string;
  previewVideo?: string;
  isFree: boolean;
  price?: number;
  currency?: string;
  enrollmentCount: number;
  completionCount: number;
  passCount: number;
  averageRating?: number;
  reviewCount: number;
  modules: string[];
  prerequisites: string[];
  version: number;
  status: 'draft' | 'coming_soon' | 'published' | 'archived';
  publishedAt?: string;
  testModeEnabled: boolean;
  previewModule?: string;
  hasWaitlist: boolean;
  maxEnrollments?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  _id: string;
  course: string;
  title: string;
  description?: string;
  order: number;
  lessons: string[];
  isUnlocked: boolean;
  prerequisites?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id: string;
  module: string;
  title: string;
  content: string;
  order: number;
  hasVideo: boolean;
  videoSource?: VideoSource;
  videoUrl?: string;
  videoId?: string;
  videoDuration?: number;
  videoThumbnail?: string;
  videoTranscript?: string;
  videoCaptions?: Array<{
    language: string;
    url: string;
    format: 'vtt' | 'srt';
  }>;
  allowDownload: boolean;
  playbackSpeedOptions?: number[];
  hasInteractiveQuiz: boolean;
  interactiveQuizData?: Array<{
    timestamp: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  resources: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  assignments: string[];
  quizzes: string[];
  exercises: string[];
  prerequisites?: string[];
  isUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  _id: string;
  lesson: string;
  course: string;
  title: string;
  description: string;
  assignmentType: AssignmentType;
  rubric: string;
  starterCode?: string;
  testCases?: any[];
  language?: string;
  githubRepoUrl?: string;
  githubOrg?: string;
  expectedCommands?: string[];
  commandOnly: boolean;
  allowRetries: boolean;
  maxRetries?: number;
  deadline?: string;
  totalPoints: number;
  isRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  assignment: string;
  user: string;
  course: string;
  content: string;
  files?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  githubRepoUrl?: string;
  githubCommitSha?: string;
  status: SubmissionStatus;
  grade?: string;
  score?: number;
  maxScore: number;
  feedback?: string;
  attemptNumber: number;
  submittedAt: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseReview {
  _id: string;
  course: string;
  user: string | User;
  rating: number;
  difficultyRating?: number;
  title?: string;
  content: string;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulVotes: string[];
  notHelpfulVotes: string[];
  isVerified: boolean;
  isPublic: boolean;
  isReported: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseBundle {
  _id: string;
  name: string;
  description: string;
  courses: Array<string | Course>;
  price: number;
  currency: string;
  originalPrice?: number;
  discountPercentage?: number;
  thumbnail?: string;
  tags: string[];
  category?: string;
  isActive: boolean;
  isPublic: boolean;
  startDate?: string;
  endDate?: string;
  salesCount: number;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BundlePurchase {
  _id: string;
  user: string | User;
  bundle: string | CourseBundle;
  price: number;
  currency: string;
  discountAmount?: number;
  stripePaymentIntentId?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  coursesEnrolled: Array<string | Course>;
  enrolledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Learning Path Types
// ============================================================================

export interface LearningPath {
  _id: string;
  name: string;
  description?: string;
  type: LearningPathType;
  courses: Array<{
    course: string | Course;
    order: number;
    isRequired: boolean;
  }>;
  prerequisites: string[];
  requiredCourses?: string[];
  estimatedDuration: number;
  difficulty: DifficultyLevel;
  tags: string[];
  category?: string;
  thumbnail?: string;
  milestones?: Array<{
    name: string;
    description?: string;
    courseIndex: number;
    xpReward?: number;
  }>;
  enrollmentCount: number;
  completionCount: number;
  isActive: boolean;
  isPublic: boolean;
  aiSettings?: {
    targetSkill?: string;
    learningStyle?: string;
    timeCommitment?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Gamification Types
// ============================================================================

export interface Achievement {
  _id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  category: AchievementCategory;
  icon?: string;
  xpReward: number;
  unlockCriteria: {
    type: string;
    value: any;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockCriteria: {
    type: string;
    value: any;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Challenge {
  _id: string;
  title: string;
  description: string;
  type: ChallengeType;
  targetValue: number;
  customCriteria?: {
    type: string;
    value: any;
    [key: string]: any;
  };
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  participantCount: number;
  maxParticipants?: number;
  xpReward?: number;
  badgeReward?: string;
  achievementReward?: string;
  eligibilityCriteria?: {
    minLevel?: number;
    minXP?: number;
    subscriptionTier?: 'free' | 'premium' | 'all';
    [key: string]: any;
  };
  showLeaderboard: boolean;
  leaderboardType?: 'top' | 'all';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LearningGoalType =
  | 'complete_courses'
  | 'earn_xp'
  | 'reach_level'
  | 'complete_assignments'
  | 'complete_lessons'
  | 'maintain_streak'
  | 'share_projects'
  | 'custom';

export type LearningGoalStatus = 'active' | 'completed' | 'failed' | 'paused';

export interface LearningGoal {
  _id: string;
  user: string | User;
  title: string;
  description?: string;
  type: LearningGoalType;
  targetValue: number;
  currentValue: number;
  customCriteria?: {
    type?: string;
    value?: any;
    [key: string]: any;
  };
  hasDeadline: boolean;
  deadline?: string;
  xpReward?: number;
  badgeReward?: string | Badge;
  achievementReward?: string | Achievement;
  status: LearningGoalStatus;
  startedAt: string;
  completedAt?: string;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningGoalStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  byType: Record<string, number>;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    _id: string;
    username: string;
    profilePhoto?: string;
    level: number;
    xp: number;
  };
  value: number;
  metadata?: any;
}

// ============================================================================
// Social Types
// ============================================================================

export interface Post {
  _id: string;
  user: string | User;
  content: string;
  type: PostType;
  media?: Array<{
    url: string;
    type: string;
  }>;
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  sharedProject?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  user: string | User;
  content: string;
  post?: string;
  parentComment?: string;
  replies?: Comment[];
  likesCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string | User;
  content: string;
  contentEncrypted: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: string[] | User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin'
  | 'dart'
  | 'r'
  | 'sql'
  | 'html'
  | 'css'
  | 'bash'
  | 'powershell';

export type CodeExecutionStatus = 'success' | 'error' | 'timeout' | 'runtime_error';

export interface CodeExecutionResult {
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
  status: CodeExecutionStatus;
}

export interface CodeSnippet {
  _id: string;
  user: string | User;
  course?: string | Course;
  lesson?: string;
  assignment?: string;
  title?: string;
  code: string;
  language: CodeLanguage;
  lastExecuted?: string;
  executionResult?: CodeExecutionResult;
  isPublic: boolean;
  tags?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  user: string | User;
  title: string;
  description: string;
  type: ProjectType;
  githubRepoUrl?: string;
  deployedUrl?: string;
  files?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  codeSnippet?: string;
  language?: string;
  course?: string;
  assignment?: string;
  tags: string[];
  category?: string;
  likesCount: number;
  commentsCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollaborativeProject {
  _id: string;
  owner: string | User;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'archived';
  members: Array<{
    user: string | User;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    joinedAt: string;
    permissions: {
      canEdit: boolean;
      canDelete: boolean;
      canInvite: boolean;
      canManageTasks: boolean;
    };
  }>;
  tasks: Array<{
    _id: string;
    title: string;
    description?: string;
    assignedTo?: string | User;
    status: 'todo' | 'in_progress' | 'completed' | 'review';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    completedAt?: string;
  }>;
  discussion: Array<{
    _id: string;
    user: string | User;
    content: string;
    createdAt: string;
  }>;
  tags: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  relatedUser?: string | User;
  relatedCourse?: string;
  relatedPost?: string;
  relatedComment?: string;
  relatedMessage?: string;
  relatedAchievement?: string;
  relatedBadge?: string;
  relatedAssignment?: string;
  relatedForumPost?: string;
  metadata?: {
    [key: string]: any;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Certificate Types
// ============================================================================

export interface Certificate {
  _id: string;
  user: string | User;
  course?: string | { _id: string; title: string };
  courseCompletion?: string;
  title: string;
  description?: string;
  issuedDate: string;
  certificateId: string;
  verificationCode: string;
  shareableLink: string;
  certificateData: {
    userName: string;
    courseName?: string;
    completionDate: string;
    finalScore?: number;
    passed?: boolean;
    duration?: string;
    issuedBy: string;
  };
  pdfUrl?: string;
  pdfKey?: string;
  template?: string;
  design?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    logoUrl?: string;
  };
  metadata?: {
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Learning Tools Types
// ============================================================================

export interface Note {
  _id: string;
  user: string | User;
  lesson: string | { _id: string; title: string; order: number };
  course: string | { _id: string; title: string; thumbnail?: string };
  title?: string;
  content: string;
  isHighlight: boolean;
  highlightedText?: string;
  highlightStart?: number;
  highlightEnd?: number;
  highlightColor?: string;
  position?: {
    section?: string;
    timestamp?: number;
    paragraphIndex?: number;
  };
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardDeck {
  _id: string;
  user: string | User;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  tags?: string[];
  category?: string;
  course?: string | { _id: string; title: string };
  lesson?: string | { _id: string; title: string };
  isPublic: boolean;
  allowDuplicates: boolean;
  totalCards: number;
  activeCards: number;
  cardsDue: number;
  averageEaseFactor: number;
  lastStudied?: string;
  newCardsPerDay: number;
  reviewCardsPerDay: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  _id: string;
  user: string | User;
  deck: string | FlashcardDeck;
  front: string;
  back: string;
  hint?: string;
  frontImage?: string;
  backImage?: string;
  frontAudio?: string;
  backAudio?: string;
  tags?: string[];
  course?: string | { _id: string; title: string };
  lesson?: string | { _id: string; title: string };
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  totalReviews: number;
  correctReviews: number;
  incorrectReviews: number;
  lastReviewDate?: string;
  lastReviewResult?: 'correct' | 'incorrect';
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CodeSnippet {
  _id: string;
  user: string;
  title: string;
  code: string;
  language: string;
  description?: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Mentorship Types
// ============================================================================

export interface Mentorship {
  _id: string;
  mentor: string | User;
  mentee: string | User;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  goals: string[];
  milestones: Array<{
    _id: string;
    title: string;
    description?: string;
    targetDate?: string;
    completed: boolean;
    completedAt?: string;
  }>;
  sessions: Array<{
    _id: string;
    scheduledAt: string;
    duration: number;
    notes?: string;
    completed: boolean;
  }>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipRequest {
  _id: string;
  mentee: string | User;
  mentor: string | User;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Live Session Types
// ============================================================================

export interface LiveSession {
  _id: string;
  instructor: string | User;
  title: string;
  description?: string;
  course?: string;
  type: 'lecture' | 'workshop' | 'qna' | 'office_hours';
  scheduledAt: string;
  duration: number;
  maxParticipants?: number;
  registeredCount: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  meetingUrl?: string;
  recordingUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Forum Types
// ============================================================================

export interface ForumCategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  threadCount: number;
  postCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForumThread {
  _id: string;
  category: string | ForumCategory;
  author: string | User;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  lastReply?: {
    author: string | User;
    createdAt: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumPost {
  _id: string;
  course: string | { _id: string; title: string };
  author: string | User;
  type: 'question' | 'discussion' | 'announcement';
  title: string;
  content: string;
  parentPost?: string | ForumPost;
  isAnswer: boolean;
  markedAsHelpful: boolean;
  views: number;
  upvotes: number;
  downvotes: number;
  repliesCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  tags: string[];
  mentions?: string[] | User[];
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
  twoFactorToken?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchResult {
  courses?: Course[];
  users?: User[];
  posts?: Post[];
  projects?: Project[];
  forums?: ForumThread[];
  total: number;
}


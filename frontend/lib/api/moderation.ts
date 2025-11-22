import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

// Types
export type ReportType = 'post' | 'comment' | 'message' | 'user' | 'course' | 'forum_post' | 'project';
export type ReportReason = 
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'inappropriate_content'
  | 'violence'
  | 'self_harm'
  | 'copyright'
  | 'impersonation'
  | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed' | 'escalated';
export type ReportPriority = 'low' | 'normal' | 'high' | 'urgent';
export type WarningType = 'content_violation' | 'harassment' | 'spam' | 'inappropriate_behavior' | 'other';
export type WarningSeverity = 'low' | 'medium' | 'high';
export type ActionType = 'warning' | 'content_removed' | 'user_warned' | 'user_suspended' | 'user_banned' | 'no_action';

export interface ContentReport {
  _id: string;
  reporter: {
    _id: string;
    username: string;
    profilePhoto?: string;
  };
  contentType: ReportType;
  contentId: string;
  reason: ReportReason;
  description?: string;
  evidence?: string[];
  status: ReportStatus;
  priority: ReportPriority;
  reviewedBy?: {
    _id: string;
    username: string;
    profilePhoto?: string;
  };
  reviewedAt?: string;
  moderationNotes?: string;
  actionTaken?: {
    type: ActionType;
    details?: string;
    warningId?: string;
  };
  aiModerationResult?: {
    isFlagged: boolean;
    severity: 'low' | 'medium' | 'high';
    categories: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserWarning {
  _id: string;
  user: string | {
    _id: string;
    username: string;
    profilePhoto?: string;
  };
  type: WarningType;
  severity: WarningSeverity;
  reason: string;
  description: string;
  relatedReport?: string;
  relatedContent?: {
    type: string;
    id: string;
  };
  issuedBy: {
    _id: string;
    username: string;
    profilePhoto?: string;
  };
  acknowledged: boolean;
  acknowledgedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  totalWarnings: number;
  activeWarnings: number;
  bannedUsers: number;
  suspendedUsers: number;
}

export interface CreateReportData {
  contentType: ReportType;
  contentId: string;
  reason: ReportReason;
  description?: string;
  evidence?: string[];
}

export interface ReviewReportData {
  status: ReportStatus;
  actionType?: ActionType;
  actionDetails?: string;
  moderationNotes?: string;
}

export interface IssueWarningData {
  userId: string;
  type: WarningType;
  severity: WarningSeverity;
  reason: string;
  description: string;
  relatedReport?: string;
  relatedContent?: {
    type: string;
    id: string;
  };
  expiresInDays?: number;
}

export interface SuspendUserData {
  reason: string;
  duration?: number;
}

export interface BanUserData {
  reason: string;
  bannedUntil?: string;
}

export interface GetReportsParams {
  status?: ReportStatus;
  priority?: ReportPriority;
  contentType?: ReportType;
  limit?: number;
  offset?: number;
}

// API Client
export const moderationApi = {
  // Create content report (user)
  createReport: (data: CreateReportData) =>
    api.post<ApiResponse<{ report: ContentReport; message: string }>>('/moderation/reports', data),
  
  // Get reports (admin)
  getReports: (params?: GetReportsParams) => {
    const queryParams: any = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.priority) queryParams.priority = params.priority;
    if (params?.contentType) queryParams.contentType = params.contentType;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;
    
    return api.get<ApiResponse<{ reports: ContentReport[]; total: number; count: number }>>('/moderation/reports', { params: queryParams });
  },
  
  // Get single report (admin)
  getReport: (id: string) =>
    api.get<ApiResponse<{ report: ContentReport }>>(`/moderation/reports/${id}`),
  
  // Review report (admin)
  reviewReport: (id: string, data: ReviewReportData) =>
    api.put<ApiResponse<{ report: ContentReport; message: string }>>(`/moderation/reports/${id}/review`, data),
  
  // Issue warning (admin)
  issueWarning: (data: IssueWarningData) =>
    api.post<ApiResponse<{ warning: UserWarning; message: string }>>('/moderation/warnings', data),
  
  // Get user warnings (admin)
  getUserWarnings: (userId: string, includeExpired?: boolean) => {
    const queryParams: any = {};
    if (includeExpired !== undefined) queryParams.includeExpired = includeExpired;
    return api.get<ApiResponse<{ warnings: UserWarning[]; count: number }>>(`/moderation/warnings/user/${userId}`, { params: queryParams });
  },
  
  // Suspend user (admin)
  suspendUser: (userId: string, data: SuspendUserData) =>
    api.post<ApiResponse<{ message: string }>>(`/moderation/users/${userId}/suspend`, data),
  
  // Ban user (admin)
  banUser: (userId: string, data: BanUserData) =>
    api.post<ApiResponse<{ message: string }>>(`/moderation/users/${userId}/ban`, data),
  
  // Unban user (admin)
  unbanUser: (userId: string) =>
    api.post<ApiResponse<{ message: string }>>(`/moderation/users/${userId}/unban`),
  
  // Get moderation stats (admin)
  getStats: () =>
    api.get<ApiResponse<ModerationStats>>('/moderation/stats'),
};


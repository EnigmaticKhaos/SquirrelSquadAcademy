import { api } from '../apiClient';
import type { ApiResponse } from '@/types';

// Types
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ExportFormat = 'json' | 'csv' | 'pdf';

export interface DataExport {
  _id: string;
  user: string;
  status: ExportStatus;
  format: ExportFormat;
  requestedAt: string;
  completedAt?: string;
  expiresAt: string;
  fileUrl?: string;
  fileSize?: number;
  fileName?: string;
  includeProfile: boolean;
  includeCourses: boolean;
  includeSocial: boolean;
  includeAnalytics: boolean;
  includeMessages: boolean;
  includeProjects: boolean;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CookieConsent {
  _id: string;
  user?: string;
  sessionId?: string;
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  ipAddress?: string;
  userAgent?: string;
  consentedAt: string;
  lastUpdatedAt: string;
}

export interface PrivacySettings {
  privacyPolicyAccepted: boolean;
  privacyPolicyAcceptedAt?: string;
  privacyPolicyVersion?: string;
  cookieConsent?: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
    consentedAt?: string;
  };
  dataProcessingConsent: boolean;
  dataProcessingConsentAt?: string;
  marketingConsent: boolean;
  marketingConsentAt?: string;
  accountDeletionRequested?: boolean;
  accountDeletionScheduled?: string;
  accountDeletedAt?: string;
  privacySettings?: {
    profileVisibility?: 'public' | 'private' | 'friends';
    whoCanMessage?: 'everyone' | 'friends' | 'none';
    activityVisibility?: 'public' | 'private' | 'friends';
  };
}

export interface ExportOptions {
  format?: ExportFormat;
  includeProfile?: boolean;
  includeCourses?: boolean;
  includeSocial?: boolean;
  includeAnalytics?: boolean;
  includeMessages?: boolean;
  includeProjects?: boolean;
}

export interface CookieConsentPreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  sessionId?: string;
}

// API Client
export const dataPrivacyApi = {
  // Data Export
  exportUserData: (options: ExportOptions) =>
    api.post<ApiResponse<{ export: DataExport; data?: any }>>('/privacy/export', options),
  
  getExportHistory: () =>
    api.get<ApiResponse<{ exports: DataExport[] }>>('/privacy/exports'),
  
  getExportStatus: (id: string) =>
    api.get<ApiResponse<{ export: DataExport }>>(`/privacy/export/${id}`),

  // Account Deletion
  requestAccountDeletion: (data: { password: string; deletionDelayDays?: number }) =>
    api.post<ApiResponse<{ message: string }>>('/privacy/account/deletion-request', data),
  
  cancelAccountDeletion: () =>
    api.post<ApiResponse<{ message: string }>>('/privacy/account/cancel-deletion'),
  
  deleteAccount: (data: { password: string; confirm: string }) =>
    api.delete<ApiResponse<{ message: string }>>('/privacy/account', { data }),

  // Cookie Consent
  saveCookieConsent: (preferences: CookieConsentPreferences) =>
    api.post<ApiResponse<{ consent: CookieConsent }>>('/privacy/cookie-consent', preferences),
  
  getCookieConsent: (sessionId?: string) =>
    api.get<ApiResponse<{ consent: CookieConsent | null }>>('/privacy/cookie-consent', {
      params: sessionId ? { sessionId } : undefined,
    }),

  // Privacy Policy & Consents
  acceptPrivacyPolicy: () =>
    api.post<ApiResponse<{ message: string }>>('/privacy/privacy-policy/accept'),
  
  updateDataProcessingConsent: (consent: boolean) =>
    api.put<ApiResponse<{ message: string }>>('/privacy/data-processing-consent', { consent }),
  
  updateMarketingConsent: (consent: boolean) =>
    api.put<ApiResponse<{ message: string }>>('/privacy/marketing-consent', { consent }),

  // Privacy Settings
  getPrivacySettings: () =>
    api.get<ApiResponse<{ settings: PrivacySettings }>>('/privacy/settings'),
};


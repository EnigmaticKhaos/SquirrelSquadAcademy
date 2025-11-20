'use client';

import { api } from '../apiClient';
import type { ApiResponse, User, LoginCredentials, RegisterData } from '@/types';

export const authApi = {
  // Register
  register: (data: RegisterData) => api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),
  
  // Login
  login: (credentials: LoginCredentials) => api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials),
  
  // Logout
  logout: () => api.post<ApiResponse<void>>('/auth/logout'),
  
  // Get current user
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),
  
  // Verify email
  verifyEmail: (token: string) => api.get<ApiResponse<void>>(`/auth/verify-email/${token}`),
  
  // Resend verification email
  resendVerificationEmail: (email: string) => api.post<ApiResponse<void>>('/auth/resend-verification', { email }),
  
  // Forgot password
  forgotPassword: (email: string) => api.post<ApiResponse<void>>('/auth/forgot-password', { email }),
  
  // Reset password
  resetPassword: (token: string, password: string) => api.post<ApiResponse<void>>(`/auth/reset-password/${token}`, { password }),
  
  // OAuth
  oauth: {
    google: () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      window.location.href = `${apiUrl}/auth/oauth/google`;
    },
    github: () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      window.location.href = `${apiUrl}/auth/oauth/github`;
    },
    discord: () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      window.location.href = `${apiUrl}/auth/oauth/discord`;
    },
  },
  
  // 2FA
  twoFactor: {
    setup: () => api.post<ApiResponse<{ secret: string; qrCode: string; backupCodes: string[] }>>('/auth/2fa/setup'),
    verify: (token: string) => api.post<ApiResponse<void>>('/auth/2fa/verify', { token }),
    enable: (token: string) => api.post<ApiResponse<void>>('/auth/2fa/enable', { token }),
    disable: (password: string) => api.post<ApiResponse<void>>('/auth/2fa/disable', { password }),
    getBackupCodes: () => api.get<ApiResponse<{ backupCodes: string[] }>>('/auth/2fa/backup-codes'),
    regenerateBackupCodes: () => api.post<ApiResponse<{ backupCodes: string[] }>>('/auth/2fa/regenerate-backup-codes'),
  },
};


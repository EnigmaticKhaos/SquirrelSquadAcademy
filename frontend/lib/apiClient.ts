'use client';

import axios from 'axios';
import { showToast, getErrorMessage } from './toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Create axios instance with default configuration
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Add auth token to requests
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Handle API errors globally
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 errors, not network errors (ERR_CONNECTION_REFUSED, etc.)
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      // Only redirect if not already on login/register pages to avoid refresh loops
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.startsWith('/login') || 
                          currentPath.startsWith('/register') || 
                          currentPath.startsWith('/verify-email') ||
                          currentPath.startsWith('/resend-verification');
        
        if (!isAuthPage) {
          localStorage.removeItem('token');
          showToast.error('Session expired', 'Please log in again');
          // Redirect to home page instead of login on logout/401
          // Only redirect to login if we're not already there
          if (currentPath !== '/login') {
            window.location.replace('/');
          }
        } else {
          // Just clear the token if already on auth pages
          localStorage.removeItem('token');
        }
      }
    } else if (error.response?.status >= 500) {
      // Show toast for server errors
      showToast.error('Server error', getErrorMessage(error));
    } else if (error.response?.status === 403) {
      // Show toast for forbidden errors
      showToast.error('Access denied', 'You don\'t have permission to perform this action');
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      // Show toast for network errors
      showToast.error('Connection error', 'Unable to connect to the server. Please check your connection.');
    }
    // For other errors, let the component handle it
    return Promise.reject(error);
  }
);

/**
 * API response type
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}


'use client';

import { api } from '../apiClient';
import type { ApiResponse, CodeExecutionResult, CodeLanguage, CodeSnippet } from '@/types';

// Re-export types for convenience
export type { CodeSnippet, CodeExecutionResult, CodeLanguage } from '@/types';

export interface SaveSnippetPayload {
  code: string;
  language: CodeLanguage;
  title?: string;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  isPublic?: boolean;
  tags?: string[];
  description?: string;
}

export interface SnippetQueryParams {
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  language?: CodeLanguage;
  limit?: number;
  offset?: number;
}

export const codePlaygroundApi = {
  executeCode: (data: { code: string; language: CodeLanguage; stdin?: string }) =>
    api.post<ApiResponse<CodeExecutionResult>>('/playground/execute', data),

  validateCode: (data: { code: string; language: CodeLanguage }) =>
    api.post<ApiResponse<{ valid: boolean; message?: string }>>('/playground/validate', data),

  saveSnippet: (payload: SaveSnippetPayload) =>
    api.post<ApiResponse<CodeSnippet>>('/playground/snippets', payload),

  updateSnippet: (id: string, payload: Partial<SaveSnippetPayload>) =>
    api.put<ApiResponse<CodeSnippet>>(`/playground/snippets/${id}`, payload),

  deleteSnippet: (id: string) => api.delete<ApiResponse<void>>(`/playground/snippets/${id}`),

  getMySnippets: (params?: SnippetQueryParams) =>
    api.get<ApiResponse<CodeSnippet[]>>('/playground/snippets', { params }),

  getPublicSnippets: (params?: { language?: CodeLanguage; courseId?: string; limit?: number; offset?: number }) =>
    api.get<ApiResponse<CodeSnippet[]>>('/playground/snippets/public', { params }),

  getSnippet: (id: string) => api.get<ApiResponse<CodeSnippet>>(`/playground/snippets/${id}`),

  executeSnippet: (id: string, data?: { stdin?: string }) =>
    api.post<ApiResponse<CodeSnippet>>(`/playground/snippets/${id}/execute`, data),
};

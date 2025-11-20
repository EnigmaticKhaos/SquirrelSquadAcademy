import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { codePlaygroundApi } from '@/lib/api/codePlayground';
import type { CodeSnippet, CodeExecutionResult, CodeLanguage } from '@/types';
import type { PaginatedResponse } from '@/types';

export const useExecuteCode = () => {
  return useMutation({
    mutationFn: (data: { code: string; language: CodeLanguage; stdin?: string }) =>
      codePlaygroundApi.executeCode(data),
  });
};

export const useValidateCode = () => {
  return useMutation({
    mutationFn: (data: { code: string; language: CodeLanguage }) =>
      codePlaygroundApi.validateCode(data),
  });
};

export const useSaveSnippet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: codePlaygroundApi.saveSnippet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-snippets', 'my'] });
    },
  });
};

export const useUpdateSnippet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CodeSnippet> }) =>
      codePlaygroundApi.updateSnippet(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['code-snippets', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['code-snippets', 'my'] });
    },
  });
};

export const useDeleteSnippet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: codePlaygroundApi.deleteSnippet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-snippets', 'my'] });
    },
  });
};

export const useMySnippets = (params?: { page?: number; limit?: number }) => {
  return useQuery<PaginatedResponse<CodeSnippet>>({
    queryKey: ['code-snippets', 'my', params],
    queryFn: async () => {
      const response = await codePlaygroundApi.getMySnippets(params);
      return response.data.data || { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    },
  });
};

export const usePublicSnippets = (params?: { page?: number; limit?: number; language?: string; search?: string }) => {
  return useQuery<PaginatedResponse<CodeSnippet>>({
    queryKey: ['code-snippets', 'public', params],
    queryFn: async () => {
      const response = await codePlaygroundApi.getPublicSnippets(params);
      return response.data.data || { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    },
  });
};

export const useSnippet = (id: string) => {
  return useQuery<CodeSnippet | null>({
    queryKey: ['code-snippets', id],
    queryFn: async () => {
      const response = await codePlaygroundApi.getSnippet(id);
      return response.data.data || null;
    },
    enabled: !!id,
    placeholderData: null,
  });
};

export const useExecuteSnippet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, stdin }: { id: string; stdin?: string }) =>
      codePlaygroundApi.executeSnippet(id, stdin),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['code-snippets', variables.id] });
    },
  });
};


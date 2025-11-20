import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import type { LoginCredentials, RegisterData, User } from '@/types';

export const useAuth = () => {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await authApi.getMe();
        // Backend returns { success: true, data: user }
        return response.data.data || null;
      } catch (error: any) {
        // If 401 (unauthorized), clear token and return null
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          return null;
        }
        // For network errors (connection refused, etc.), don't clear user data
        // Just throw the error - React Query will keep previous data
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      // Retry network errors up to 1 time (quick retry)
      return failureCount < 1;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'), // Only fetch if token exists
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: 'always', // Always refetch on mount to get fresh data
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    // Keep previous data on error (network errors won't clear user)
    placeholderData: (previousData) => previousData,
    // Keep data in cache even on error
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
  
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (response) => {
      // Backend returns { success: true, token, user } directly in response.data
      const token = (response.data as any).token;
      const user = (response.data as any).user;
      
      if (token) {
        localStorage.setItem('token', token);
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      }
      if (user) {
        queryClient.setQueryData(['auth', 'me'], user);
      }
    },
  });
  
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (response) => {
      // Backend returns { success: true, token, user } directly in response.data
      const token = (response.data as any).token;
      const user = (response.data as any).user;
      
      if (token) {
        localStorage.setItem('token', token);
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      }
      if (user) {
        queryClient.setQueryData(['auth', 'me'], user);
      }
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      localStorage.removeItem('token');
      queryClient.setQueryData(['auth', 'me'], null);
    },
  });
  
  return {
    user: user as User | undefined,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
};


'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SocketProvider } from '@/providers/SocketProvider';
import { Toaster } from '@/components/ui/Toaster';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundaryWrapper';
import { AccessibilityProvider } from '@/components/AccessibilityProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnMount: 'always', // Only refetch on mount if data is stale
            refetchOnReconnect: false, // Don't refetch on reconnect
            retry: 1, // Only retry once on failure
          },
        },
      })
  );

  return (
    <ErrorBoundaryWrapper level="page">
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <AccessibilityProvider>
            {children}
            <Toaster />
          </AccessibilityProvider>
        </SocketProvider>
      </QueryClientProvider>
    </ErrorBoundaryWrapper>
  );
}


'use client';

'use client';

import React, { ReactNode, ErrorInfo } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  level?: 'page' | 'component';
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

/**
 * Wrapper component for ErrorBoundary with hooks support
 * Use this in functional components instead of the class-based ErrorBoundary
 */
export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({
  children,
  level = 'page',
  fallback,
  onError,
  resetKeys,
}) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log error to console
    console.error('ErrorBoundaryWrapper caught error:', error, errorInfo);
    
    // Call custom error handler
    onError?.(error, errorInfo);
    
    // You can add error reporting service here
    // Example: logErrorToService(error, errorInfo);
  };

  return (
    <ErrorBoundary
      level={level}
      fallback={fallback}
      onError={handleError}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Hook to manually trigger error boundary reset
 * Useful for programmatic error recovery
 */
export const useErrorHandler = () => {
  const triggerError = (error: Error) => {
    throw error;
  };

  return { triggerError };
};

